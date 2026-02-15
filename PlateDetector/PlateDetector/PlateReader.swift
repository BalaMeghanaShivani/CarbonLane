// PlateReader.swift
// Apple Vision OCR for license plate text recognition

import Vision
import UIKit
import CoreGraphics

class PlateReader {

    /// Recognize text in a cropped image region (the detected car area)
    /// - Parameters:
    ///   - pixelBuffer: The full camera frame
    ///   - boundingBox: Normalized bounding box of the detected car (0-1 coordinates)
    ///   - completion: Returns recognized text strings (potential plate numbers)
    static func recognizeText(
        in pixelBuffer: CVPixelBuffer,
        boundingBox: CGRect,
        completion: @escaping ([String]) -> Void
    ) {
        // Convert Vision coordinates (origin bottom-left) to image coordinates
        let imageWidth = CGFloat(CVPixelBufferGetWidth(pixelBuffer))
        let imageHeight = CGFloat(CVPixelBufferGetHeight(pixelBuffer))

        // Crop region for the car bounding box
        // Focus on the lower portion of the car where the plate usually is
        let plateRegion = CGRect(
            x: boundingBox.origin.x,
            y: boundingBox.origin.y + boundingBox.height * 0.5, // lower half of car
            width: boundingBox.width,
            height: boundingBox.height * 0.5
        ).intersection(CGRect(x: 0, y: 0, width: 1, height: 1))

        // Vision uses bottom-left origin, so flip Y
        let visionRegion = CGRect(
            x: plateRegion.origin.x,
            y: 1.0 - plateRegion.origin.y - plateRegion.height,
            width: plateRegion.width,
            height: plateRegion.height
        )

        let request = VNRecognizeTextRequest { request, error in
            guard error == nil,
                  let observations = request.results as? [VNRecognizedTextObservation] else {
                completion([])
                return
            }

            let texts = observations.compactMap { observation -> String? in
                guard let candidate = observation.topCandidates(1).first,
                      candidate.confidence > 0.3 else { return nil }
                let text = candidate.string.trimmingCharacters(in: .whitespacesAndNewlines)
                // Filter: plates are typically 2-10 characters with alphanumeric chars
                let alphanumeric = text.filter { $0.isLetter || $0.isNumber }
                if alphanumeric.count >= 2 && alphanumeric.count <= 10 {
                    return text
                }
                return nil
            }

            completion(texts)
        }

        request.recognitionLevel = .fast
        request.usesLanguageCorrection = false
        request.regionOfInterest = visionRegion

        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])

        DispatchQueue.global(qos: .userInitiated).async {
            do {
                try handler.perform([request])
            } catch {
                print("[PlateReader] OCR error: \(error)")
                completion([])
            }
        }
    }

    /// Simple heuristic to check if text looks like a license plate
    static func looksLikePlate(_ text: String) -> Bool {
        let cleaned = text.filter { $0.isLetter || $0.isNumber }
        // Most plates: 4-8 alphanumeric characters, mix of letters and digits
        guard cleaned.count >= 4 && cleaned.count <= 9 else { return false }
        let hasLetters = cleaned.contains(where: { $0.isLetter })
        let hasDigits = cleaned.contains(where: { $0.isNumber })
        return hasLetters && hasDigits
    }
}
