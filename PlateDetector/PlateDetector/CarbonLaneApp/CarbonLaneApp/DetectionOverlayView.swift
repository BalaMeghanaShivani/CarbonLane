// DetectionOverlayView.swift
// Draws bounding boxes and plate text on top of camera preview

import SwiftUI

struct DetectionOverlayView: View {
    let detections: [Detection]
    let viewSize: CGSize

    var body: some View {
        ZStack {
            ForEach(detections) { detection in
                let rect = convertBox(detection.boundingBox, to: viewSize)

                // Bounding box
                Rectangle()
                    .stroke(boxColor(for: detection), lineWidth: 2.5)
                    .frame(width: rect.width, height: rect.height)
                    .position(x: rect.midX, y: rect.midY)

                // Label background
                VStack(spacing: 2) {
                    // Class label + confidence
                    Text("\(detection.classLabel) \(Int(detection.confidence * 100))%")
                        .font(.system(size: 12, weight: .bold, design: .monospaced))
                        .foregroundColor(.white)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(boxColor(for: detection).opacity(0.85))
                        .cornerRadius(4)

                    // Plate text (if detected)
                    if let plate = detection.plateText {
                        Text("🔤 \(plate)")
                            .font(.system(size: 14, weight: .heavy, design: .monospaced))
                            .foregroundColor(.black)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.yellow.opacity(0.9))
                            .cornerRadius(6)
                    }
                }
                .position(x: rect.midX, y: max(rect.minY - 20, 20))
            }
        }
    }

    /// Convert normalized (0-1) bounding box to view coordinates
    private func convertBox(_ box: CGRect, to size: CGSize) -> CGRect {
        CGRect(
            x: box.origin.x * size.width,
            y: box.origin.y * size.height,
            width: box.width * size.width,
            height: box.height * size.height
        )
    }

    /// Color coding: green for car with plate, blue for car without plate
    private func boxColor(for detection: Detection) -> Color {
        if detection.plateText != nil {
            return .green
        }
        return .blue
    }
}
