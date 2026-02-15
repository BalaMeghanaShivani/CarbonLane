// Detection.swift
// Data models for YOLO detections and plate readings

import Foundation
import CoreGraphics

/// A single YOLO detection result
struct Detection: Identifiable {
    let id = UUID()
    /// Bounding box in normalized coordinates (0-1) relative to the camera frame
    let boundingBox: CGRect
    /// Detection confidence (0-1)
    let confidence: Float
    /// COCO class index
    let classIndex: Int
    /// COCO class label
    let classLabel: String
    /// Recognized license plate text (nil if OCR hasn't run or found nothing)
    var plateText: String?
}

/// COCO dataset class names (80 classes)
let cocoClassNames: [String] = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck",
    "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench",
    "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra",
    "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
    "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove",
    "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup",
    "fork", "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
    "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch",
    "potted plant", "bed", "dining table", "toilet", "tv", "laptop", "mouse",
    "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
    "refrigerator", "book", "clock", "vase", "scissors", "teddy bear",
    "hair drier", "toothbrush"
]

/// Vehicle-related COCO class indices
let vehicleClassIndices: Set<Int> = [2, 3, 5, 7] // car, motorcycle, bus, truck
