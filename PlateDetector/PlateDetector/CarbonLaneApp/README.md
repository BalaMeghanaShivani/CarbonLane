# CarbonLane iOS App

This iOS app uses on-device **YOLOv8** for car detection and **Apple Vision** for license plate OCR.

## How Detection Works

The detection pipeline runs on every camera frame (30fps) in real-time:

1.  **Camera Input**:
    -   `CameraManager.swift` captures video frames from the back camera using `AVCaptureSession`.
    -   Frames are converted to `CVPixelBuffer` format.

2.  **Vehicle Detection (YOLOv8 + CoreML)**:
    -   `YOLODetector.swift` sends the frame to the CoreML model (`yolov8s.mlpackage`).
    -   The model returns bounding boxes and class labels.
    -   We filter for `classLabel == "car"` (COCO class 2) with confidence > 50%.
    -   Result: A bounding box `CGRect` around the car.

3.  **License Plate OCR (Apple Vision)**:
    -   Once a car is detected, we crop the image to the car's bounding box.
    -   `PlateReader.swift` runs Apple's `VNRecognizeTextRequest` on the cropped car image.
    -   Configured for `.accurate` recognition level (slower but better for text).
    -   It scans for text patterns that look like license plates (alphanumeric, 3-8 chars).

4.  **UI Overlay**:
    -   `DetectionOverlayView.swift` draws a **Green Box** around the car.
    -   If a plate is read, it draws **Yellow Text** above the car showing the plate number.

5.  **Backend Integration**:
    -   When you tap **"Record Entry"**, `APIClient.swift` sends a `POST` request to your Flask backend with the detected plate number.

## Key Files

-   `YOLODetector.swift`: Handles CoreML vehicle detection.
-   `PlateReader.swift`: Handles OCR text recognition.
-   `CameraManager.swift`: Manages camera session.
-   `APIClient.swift`: Communicates with Python backend.
