// ContentView.swift
// Main UI: camera preview + detection overlay + plate recording controls

import SwiftUI
import AVFoundation
import Combine

class DetectionViewModel: ObservableObject, CameraManagerDelegate {
    @Published var detections: [Detection] = []
    @Published var lastPlateText: String?
    @Published var statusMessage: String = "Loading YOLO model..."
    @Published var recordedPlates: Set<String> = []
    @Published var pendingCars: [PendingCar] = []

    let cameraManager = CameraManager()
    let yoloDetector = YOLODetector()

    private var frameCount = 0
    private let processEveryNFrames = 5 // Process every 5th frame for performance
    private var isProcessing = false

    func setup() {
        cameraManager.delegate = self
        cameraManager.checkPermission()

        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.yoloDetector.loadModel()
            DispatchQueue.main.async {
                if self?.yoloDetector.isReady == true {
                    self?.statusMessage = "YOLO ready — point camera at a car"
                    self?.cameraManager.start()
                } else {
                    self?.statusMessage = "⚠️ Failed to load YOLO model. Ensure yolov8s.mlpackage is in the app bundle."
                }
            }
        }

        // Fetch pending cars from backend
        refreshPendingCars()
    }

    func refreshPendingCars() {
        APIClient.getPendingCars { [weak self] cars in
            DispatchQueue.main.async {
                self?.pendingCars = cars
            }
        }
    }

    func recordEntry(plate: String) {
        guard !recordedPlates.contains(plate) else { return }
        recordedPlates.insert(plate)
        statusMessage = "Recording entry: \(plate)..."

        APIClient.recordCarEntry(numberplate: plate) { [weak self] success, error in
            DispatchQueue.main.async {
                if success {
                    self?.statusMessage = "✅ Recorded: \(plate)"
                    self?.refreshPendingCars()
                } else {
                    self?.statusMessage = "❌ Failed: \(error ?? "Unknown error")"
                    self?.recordedPlates.remove(plate) // Allow retry
                }
            }
        }
    }

    func recordExit() {
        statusMessage = "Recording exit..."
        APIClient.recordCarExit { [weak self] success, error in
            DispatchQueue.main.async {
                if success {
                    self?.statusMessage = "✅ Exit recorded"
                    self?.refreshPendingCars()
                } else {
                    self?.statusMessage = "❌ Exit failed: \(error ?? "Unknown error")"
                }
            }
        }
    }

    // MARK: - CameraManagerDelegate

    func cameraManager(_ manager: CameraManager, didOutput pixelBuffer: CVPixelBuffer) {
        frameCount += 1
        guard frameCount % processEveryNFrames == 0 else { return }
        guard !isProcessing else { return }

        isProcessing = true

        // Run YOLO detection
        let detections = yoloDetector.detect(pixelBuffer: pixelBuffer)

        // For each vehicle detection, try to read the license plate
        var updatedDetections = detections
        let group = DispatchGroup()

        for (index, detection) in detections.enumerated() {
            group.enter()
            PlateReader.recognizeText(in: pixelBuffer, boundingBox: detection.boundingBox) { texts in
                // Find the best plate-like text
                let plateText = texts.first(where: { PlateReader.looksLikePlate($0) }) ?? texts.first
                if let plate = plateText {
                    updatedDetections[index].plateText = plate
                }
                group.leave()
            }
        }

        group.notify(queue: .main) { [weak self] in
            self?.detections = updatedDetections
            self?.isProcessing = false

            // Update last detected plate
            if let firstPlate = updatedDetections.compactMap({ $0.plateText }).first {
                self?.lastPlateText = firstPlate
            }
        }
    }
}

struct ContentView: View {
    @StateObject private var viewModel = DetectionViewModel()

    var body: some View {
        ZStack {
            // Camera preview (full screen)
            if viewModel.cameraManager.permissionGranted {
                GeometryReader { geometry in
                    ZStack {
                        CameraPreviewView(session: viewModel.cameraManager.captureSession)
                            .ignoresSafeArea()

                        // Detection overlay
                        DetectionOverlayView(
                            detections: viewModel.detections,
                            viewSize: geometry.size
                        )
                    }
                }
            } else {
                VStack(spacing: 16) {
                    Image(systemName: "camera.fill")
                        .font(.system(size: 60))
                        .foregroundColor(.gray)
                    Text("Camera access required")
                        .font(.title2)
                    Text("Go to Settings → CarbonLaneApp → Camera")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Bottom controls overlay
            VStack {
                Spacer()

                VStack(spacing: 12) {
                    // Status bar
                    HStack {
                        Circle()
                            .fill(viewModel.yoloDetector.isReady ? Color.green : Color.red)
                            .frame(width: 10, height: 10)
                        Text(viewModel.statusMessage)
                            .font(.system(size: 13, weight: .medium, design: .monospaced))
                            .foregroundColor(.white)
                            .lineLimit(1)
                        Spacer()
                    }
                    .padding(.horizontal, 16)

                    // Detected plate display
                    if let plate = viewModel.lastPlateText {
                        HStack {
                            Text("🚗")
                                .font(.title)
                            VStack(alignment: .leading) {
                                Text("Detected Plate")
                                    .font(.caption)
                                    .foregroundColor(.white.opacity(0.7))
                                Text(plate)
                                    .font(.system(size: 22, weight: .heavy, design: .monospaced))
                                    .foregroundColor(.yellow)
                            }
                            Spacer()

                            // Record Entry button
                            if !viewModel.recordedPlates.contains(plate) {
                                Button(action: { viewModel.recordEntry(plate: plate) }) {
                                    Label("Record Entry", systemImage: "arrow.right.circle.fill")
                                        .font(.system(size: 14, weight: .bold))
                                        .foregroundColor(.black)
                                        .padding(.horizontal, 16)
                                        .padding(.vertical, 10)
                                        .background(Color.green)
                                        .cornerRadius(20)
                                }
                            } else {
                                Label("Recorded", systemImage: "checkmark.circle.fill")
                                    .font(.system(size: 14, weight: .bold))
                                    .foregroundColor(.green)
                            }
                        }
                        .padding(16)
                        .background(Color.black.opacity(0.7))
                        .cornerRadius(16)
                        .padding(.horizontal, 16)
                    }

                    // Actions row
                    HStack(spacing: 16) {
                        // Record Exit button
                        Button(action: { viewModel.recordExit() }) {
                            HStack {
                                Image(systemName: "arrow.left.circle.fill")
                                Text("Record Exit")
                            }
                            .font(.system(size: 14, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 20)
                            .padding(.vertical, 12)
                            .background(Color.red.opacity(0.8))
                            .cornerRadius(25)
                        }

                        // Pending count
                        Text("\(viewModel.pendingCars.count) in queue")
                            .font(.system(size: 13, weight: .medium, design: .monospaced))
                            .foregroundColor(.white.opacity(0.7))

                        Spacer()

                        // Refresh button
                        Button(action: { viewModel.refreshPendingCars() }) {
                            Image(systemName: "arrow.clockwise")
                                .font(.system(size: 18))
                                .foregroundColor(.white)
                                .padding(10)
                                .background(Color.white.opacity(0.2))
                                .clipShape(Circle())
                        }
                    }
                    .padding(.horizontal, 16)
                }
                .padding(.vertical, 16)
                .background(
                    LinearGradient(
                        colors: [Color.black.opacity(0), Color.black.opacity(0.85)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
            }
        }
        .ignoresSafeArea()
        .onAppear {
            viewModel.setup()
        }
    }
}
