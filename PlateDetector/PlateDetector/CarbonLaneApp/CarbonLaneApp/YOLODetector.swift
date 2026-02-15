// YOLODetector.swift
// Car detection using YOLOv8s CoreML model + Apple Vision framework
// No ExecuTorch dependency needed — runs natively on Apple Neural Engine

import Vision
import CoreML
import CoreVideo
import UIKit
import Combine

class YOLODetector: ObservableObject {
    @Published var isReady = false

    private var vnModel: VNCoreMLModel?

    // Vehicle class indices in COCO dataset (YOLOv8 uses COCO classes)
    private let vehicleClassIndices: Set<Int> = [2, 3, 5, 7] // car, motorcycle, bus, truck

    // MARK: - Load Model

    func loadModel() {
        guard let modelURL = Bundle.main.url(forResource: "yolov8s", withExtension: "mlmodelc")
                ?? Bundle.main.url(forResource: "yolov8s", withExtension: "mlpackage") else {
            // Try compiled model from .mlpackage
            if let compiledURL = findCompiledModel() {
                setupModel(from: compiledURL)
            } else {
                print("[YOLO] ❌ Model file not found in bundle")
            }
            return
        }

        setupModel(from: modelURL)
    }

    private func findCompiledModel() -> URL? {
        // Xcode auto-compiles .mlpackage to .mlmodelc at build time
        return Bundle.main.url(forResource: "yolov8s", withExtension: "mlmodelc")
    }

    private func setupModel(from url: URL) {
        do {
            let config = MLModelConfiguration()
            config.computeUnits = .all // Use Neural Engine + GPU + CPU

            let mlModel = try MLModel(contentsOf: url, configuration: config)
            vnModel = try VNCoreMLModel(for: mlModel)
            isReady = true
            print("[YOLO] ✅ Model loaded successfully (CoreML)")
        } catch {
            print("[YOLO] ❌ Failed to load model: \(error)")
        }
    }

    // MARK: - Run Detection

    func detect(pixelBuffer: CVPixelBuffer) -> [Detection] {
        guard let vnModel = vnModel else { return [] }

        var detections: [Detection] = []
        let semaphore = DispatchSemaphore(value: 0)

        let request = VNCoreMLRequest(model: vnModel) { request, error in
            defer { semaphore.signal() }

            if let error = error {
                print("[YOLO] Detection error: \(error)")
                return
            }

            guard let results = request.results as? [VNRecognizedObjectObservation] else {
                return
            }

            for observation in results {
                // Get the top classification
                guard let topLabel = observation.labels.first else { continue }

                // Check if it's a vehicle class
                let label = topLabel.identifier.lowercased()
                let isVehicle = label.contains("car") || label.contains("truck") ||
                                label.contains("bus") || label.contains("motorcycle") ||
                                label.contains("vehicle") || label.contains("van") ||
                                // COCO class index check (labels might be indices)
                                self.isVehicleClassIndex(label)

                guard isVehicle else { continue }
                guard observation.confidence > 0.3 else { continue }

                // Vision uses bottom-left origin, convert to top-left origin
                let box = observation.boundingBox
                let normalizedBox = CGRect(
                    x: box.origin.x,
                    y: 1.0 - box.origin.y - box.height,
                    width: box.width,
                    height: box.height
                )

                detections.append(Detection(
                    boundingBox: normalizedBox,
                    confidence: observation.confidence,
                    classIndex: self.classIndexFor(label: label),
                    classLabel: topLabel.identifier
                ))
            }
        }

        // Use center crop to match YOLO's square input expectation
        request.imageCropAndScaleOption = .scaleFill

        let handler = VNImageRequestHandler(cvPixelBuffer: pixelBuffer, options: [:])
        do {
            try handler.perform([request])
            semaphore.wait()
        } catch {
            print("[YOLO] Request failed: \(error)")
        }

        return detections
    }

    // MARK: - Helpers

    private func isVehicleClassIndex(_ label: String) -> Bool {
        if let index = Int(label) {
            return vehicleClassIndices.contains(index)
        }
        return false
    }

    private func classIndexFor(label: String) -> Int {
        let lower = label.lowercased()
        if lower.contains("car") { return 2 }
        if lower.contains("motorcycle") { return 3 }
        if lower.contains("bus") { return 5 }
        if lower.contains("truck") { return 7 }
        return 2 // default to car
    }
}
