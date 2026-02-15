// APIClient.swift
// HTTP client for the CarbonLane Flask backend

import Foundation

class APIClient {
    // MARK: - Configuration
    // Change this to your Flask backend URL.
    // If running locally: use your Mac's IP (find it in System Settings > Wi-Fi > Details > IP Address)
    // Example: "http://192.168.1.42:8000"
    static let baseURL = "http://10.0.0.35:8000"

    // MARK: - Car Entry (plate detected entering)
    static func recordCarEntry(numberplate: String, completion: @escaping (Bool, String?) -> Void) {
        guard let url = URL(string: "\(baseURL)/car-entries/enter") else {
            completion(false, "Invalid URL")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10

        let body: [String: String] = ["numberplate": numberplate]
        request.httpBody = try? JSONSerialization.data(withJSONObject: body)

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("[API] Entry error: \(error.localizedDescription)")
                completion(false, error.localizedDescription)
                return
            }
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(false, "No response")
                return
            }
            if httpResponse.statusCode == 200 {
                print("[API] Car entry recorded: \(numberplate)")
                completion(true, nil)
            } else {
                let body = data.flatMap { String(data: $0, encoding: .utf8) } ?? "Unknown error"
                print("[API] Entry failed (\(httpResponse.statusCode)): \(body)")
                completion(false, body)
            }
        }.resume()
    }

    // MARK: - Car Exit
    static func recordCarExit(completion: @escaping (Bool, String?) -> Void) {
        guard let url = URL(string: "\(baseURL)/car-entries/exit") else {
            completion(false, "Invalid URL")
            return
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.timeoutInterval = 10

        URLSession.shared.dataTask(with: request) { data, response, error in
            if let error = error {
                print("[API] Exit error: \(error.localizedDescription)")
                completion(false, error.localizedDescription)
                return
            }
            guard let httpResponse = response as? HTTPURLResponse else {
                completion(false, "No response")
                return
            }
            if httpResponse.statusCode == 200 {
                print("[API] Car exit recorded")
                completion(true, nil)
            } else {
                let body = data.flatMap { String(data: $0, encoding: .utf8) } ?? "Unknown error"
                print("[API] Exit failed (\(httpResponse.statusCode)): \(body)")
                completion(false, body)
            }
        }.resume()
    }

    // MARK: - Get Pending Cars
    static func getPendingCars(completion: @escaping ([PendingCar]) -> Void) {
        guard let url = URL(string: "\(baseURL)/car-entries/pending") else {
            completion([])
            return
        }

        URLSession.shared.dataTask(with: url) { data, _, error in
            guard let data = data, error == nil else {
                completion([])
                return
            }
            do {
                let cars = try JSONDecoder().decode([PendingCar].self, from: data)
                completion(cars)
            } catch {
                print("[API] Parse error: \(error)")
                completion([])
            }
        }.resume()
    }
}

struct PendingCar: Codable, Identifiable {
    let entry_id: Int
    let numberplate: String
    let enter_timestamp: String

    var id: Int { entry_id }
}
