// YOLODetector.swift
// YOLO26s object detection using ExecuTorch runtime

import ExecuTorch
import CoreVideo
import CoreGraphics
import UIKit

class YOLODetector {
    private var module: Module?
    private let inputSize: Int = 640
    private let confidenceThreshold: Float = 0.25
    private let iouThreshold: Float = 0.45
    private let numClasses: Int = 80

    /// Whether the model is loaded and ready
    var isReady: Bool { module != nil }

    // MARK: - Load Model

    func loadModel() {
        // Look for the model in the app bundle
        guard let modelPath = Bundle.main.path(forResource: "yolo26s_xnnpack", ofType: "pte") else {
            print("[YOLO] Model file yolo26s_xnnpack.pte not found in bundle")
            return
        }

        do {
            module = Module(filePath: modelPath)
            try module?.load("forward")
            print("[YOLO] Model loaded successfully")
        } catch {
            print("[YOLO] Failed to load model: \(error)")
            module = nil
        }
    }

    // MARK: - Run Detection

    /// Run YOLO detection on a camera frame
    /// - Parameter pixelBuffer: Camera frame pixel buffer (BGRA format)
    /// - Returns: Array of Detection objects for vehicles
    func detect(pixelBuffer: CVPixelBuffer) -> [Detection] {
        guard let module = module else {
            print("[YOLO] Model not loaded")
            return []
        }

        // 1. Preprocess: resize to 640×640, convert to CHW float tensor normalized to [0,1]
        let inputData = preprocessPixelBuffer(pixelBuffer)
        guard !inputData.isEmpty else { return [] }

        // 2. Run inference
        do {
            var floatData = inputData
            let inputTensor = Tensor<Float>(&floatData, shape: [1, 3, inputSize, inputSize])
            let outputValues = try module.forward(inputTensor)

            // 3. Parse output
            let outputTensor = try Tensor<Float>(outputValues)
            let outputData = outputTensor.scalars()
            let outputShape = outputTensor.shape

            print("[YOLO] Output shape: \(outputShape), total elements: \(outputData.count)")

            // 4. Post-process: parse detections, apply NMS, filter to vehicles
            let detections = postprocess(
                output: outputData,
                shape: outputShape,
                originalWidth: CGFloat(CVPixelBufferGetWidth(pixelBuffer)),
                originalHeight: CGFloat(CVPixelBufferGetHeight(pixelBuffer))
            )

            return detections

        } catch {
            print("[YOLO] Inference error: \(error)")
            return []
        }
    }

    // MARK: - Preprocessing

    private func preprocessPixelBuffer(_ pixelBuffer: CVPixelBuffer) -> [Float] {
        CVPixelBufferLockBaseAddress(pixelBuffer, .readOnly)
        defer { CVPixelBufferUnlockBaseAddress(pixelBuffer, .readOnly) }

        guard let baseAddress = CVPixelBufferGetBaseAddress(pixelBuffer) else { return [] }

        let width = CVPixelBufferGetWidth(pixelBuffer)
        let height = CVPixelBufferGetHeight(pixelBuffer)
        let bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer)
        let buffer = baseAddress.assumingMemoryBound(to: UInt8.self)

        // Output: CHW format, normalized to [0, 1]
        let size = inputSize
        var result = [Float](repeating: 0, count: 3 * size * size)

        let scaleX = Float(width) / Float(size)
        let scaleY = Float(height) / Float(size)

        for y in 0..<size {
            for x in 0..<size {
                let srcX = min(Int(Float(x) * scaleX), width - 1)
                let srcY = min(Int(Float(y) * scaleY), height - 1)
                let offset = srcY * bytesPerRow + srcX * 4 // BGRA format

                let b = Float(buffer[offset + 0]) / 255.0
                let g = Float(buffer[offset + 1]) / 255.0
                let r = Float(buffer[offset + 2]) / 255.0

                // CHW format: [R plane, G plane, B plane]
                let pixelIndex = y * size + x
                result[0 * size * size + pixelIndex] = r  // R channel
                result[1 * size * size + pixelIndex] = g  // G channel
                result[2 * size * size + pixelIndex] = b  // B channel
            }
        }

        return result
    }

    // MARK: - Postprocessing

    private func postprocess(
        output: [Float],
        shape: [Int],
        originalWidth: CGFloat,
        originalHeight: CGFloat
    ) -> [Detection] {
        // YOLO output shape is typically [1, 84, 8400] or [1, 8400, 84]
        // 84 = 4 box coords (cx, cy, w, h) + 80 class scores
        // 8400 = number of candidate detections

        let numDetections: Int
        let numChannels: Int
        let transposed: Bool

        if shape.count == 3 {
            if shape[1] == 84 || shape[1] == (4 + numClasses) {
                // [1, 84, N] format — standard YOLO
                numChannels = shape[1]
                numDetections = shape[2]
                transposed = false
            } else if shape[2] == 84 || shape[2] == (4 + numClasses) {
                // [1, N, 84] format — transposed
                numChannels = shape[2]
                numDetections = shape[1]
                transposed = true
            } else {
                print("[YOLO] Unexpected output shape: \(shape)")
                return []
            }
        } else if shape.count == 2 {
            if shape[0] == 84 || shape[0] == (4 + numClasses) {
                numChannels = shape[0]
                numDetections = shape[1]
                transposed = false
            } else {
                numChannels = shape[1]
                numDetections = shape[0]
                transposed = true
            }
        } else {
            print("[YOLO] Unexpected output dimensions: \(shape.count)")
            return []
        }

        var rawDetections: [Detection] = []

        for i in 0..<numDetections {
            // Extract box coords and class scores
            var values = [Float](repeating: 0, count: numChannels)
            for c in 0..<numChannels {
                if transposed {
                    // [1, N, 84] → offset = i * 84 + c (skip batch dim)
                    let offset = (shape.count == 3 ? shape[2] : 0)
                    values[c] = output[i * numChannels + c + (shape.count == 3 ? numDetections * 0 : 0)]
                    // Simplified: just index linearly after batch
                    let idx = i * numChannels + c
                    if idx < output.count {
                        values[c] = output[idx]
                    }
                } else {
                    // [1, 84, N] → channel c, detection i
                    let idx = c * numDetections + i
                    if idx < output.count {
                        values[c] = output[idx]
                    }
                }
            }

            let cx = values[0]
            let cy = values[1]
            let w = values[2]
            let h = values[3]

            // Find best class
            var bestClassScore: Float = 0
            var bestClassIndex = 0
            for c in 4..<numChannels {
                if values[c] > bestClassScore {
                    bestClassScore = values[c]
                    bestClassIndex = c - 4
                }
            }

            guard bestClassScore >= confidenceThreshold else { continue }

            // Only keep vehicle classes (car=2, motorcycle=3, bus=5, truck=7)
            guard vehicleClassIndices.contains(bestClassIndex) else { continue }

            // Convert from YOLO coords (pixel coords in 640x640) to normalized (0-1)
            let normX = CGFloat((cx - w / 2) / Float(inputSize))
            let normY = CGFloat((cy - h / 2) / Float(inputSize))
            let normW = CGFloat(w / Float(inputSize))
            let normH = CGFloat(h / Float(inputSize))

            let box = CGRect(
                x: max(0, normX),
                y: max(0, normY),
                width: min(normW, 1 - max(0, normX)),
                height: min(normH, 1 - max(0, normY))
            )

            let label = bestClassIndex < cocoClassNames.count ? cocoClassNames[bestClassIndex] : "class_\(bestClassIndex)"

            rawDetections.append(Detection(
                boundingBox: box,
                confidence: bestClassScore,
                classIndex: bestClassIndex,
                classLabel: label
            ))
        }

        // Apply NMS
        let filtered = nonMaxSuppression(detections: rawDetections)
        print("[YOLO] Found \(filtered.count) vehicle detections (from \(rawDetections.count) candidates)")
        return filtered
    }

    // MARK: - Non-Maximum Suppression

    private func nonMaxSuppression(detections: [Detection]) -> [Detection] {
        let sorted = detections.sorted { $0.confidence > $1.confidence }
        var kept: [Detection] = []

        for detection in sorted {
            var shouldKeep = true
            for existing in kept {
                if iou(detection.boundingBox, existing.boundingBox) > iouThreshold {
                    shouldKeep = false
                    break
                }
            }
            if shouldKeep {
                kept.append(detection)
            }
        }

        return kept
    }

    /// Intersection over Union
    private func iou(_ a: CGRect, _ b: CGRect) -> Float {
        let intersection = a.intersection(b)
        if intersection.isNull { return 0 }
        let intersectionArea = intersection.width * intersection.height
        let unionArea = a.width * a.height + b.width * b.height - intersectionArea
        return unionArea > 0 ? Float(intersectionArea / unionArea) : 0
    }
}
