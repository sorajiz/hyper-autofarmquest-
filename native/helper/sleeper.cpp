#include <iostream>
#include <chrono>
#include <thread>
#include <string>
#include <vector>
#include <fstream>

#ifdef _WIN32
#include <windows.h>
#endif

/**
 * Hyper AutoFarm Quest - Tier 2 High-Performance C++ Native Helper
 * Discord IPC Named Pipe Connector & Markterence Dummy Game Sleeper
 */

void SendNamedPipeActivity(const std::string& appId, const std::string& gameName) {
#ifdef _WIN32
    LPCSTR pipeName = "\\\\.\\pipe\\discord-ipc-0";
    HANDLE hPipe = CreateFileA(pipeName, GENERIC_READ | GENERIC_WRITE, 0, NULL, OPEN_EXISTING, 0, NULL);
    if (hPipe != INVALID_HANDLE_VALUE) {
        std::cout << "✅ [C++ Helper] Connected to Windows Named Pipe: discord-ipc-0" << std::endl;

        // Opcode 0: Handshake
        std::string handshake = "{\"v\":1,\"client_id\":\"" + appId + "\"}";
        uint32_t opHandshake = 0;
        uint32_t lenHandshake = static_cast<uint32_t>(handshake.length());

        DWORD written = 0;
        WriteFile(hPipe, &opHandshake, 4, &written, NULL);
        WriteFile(hPipe, &lenHandshake, 4, &written, NULL);
        WriteFile(hPipe, handshake.c_str(), lenHandshake, &written, NULL);
        FlushFileBuffers(hPipe);

        std::this_thread::sleep_for(std::chrono::milliseconds(500));

        // Opcode 1: SET_ACTIVITY
        std::string activity = "{\"cmd\":\"SET_ACTIVITY\",\"args\":{\"pid\":" + 
                               std::to_string(GetCurrentProcessId()) + 
                               ",\"activity\":{\"details\":\"Farming " + gameName + 
                               "\",\"state\":\"In Game\"}},\"nonce\":\"hyper-cpp-token\"}";
        uint32_t opActivity = 1;
        uint32_t lenActivity = static_cast<uint32_t>(activity.length());

        WriteFile(hPipe, &opActivity, 4, &written, NULL);
        WriteFile(hPipe, &lenActivity, 4, &written, NULL);
        WriteFile(hPipe, activity.c_str(), lenActivity, &written, NULL);
        FlushFileBuffers(hPipe);

        std::cout << "📡 [C++ Helper] Dispatched SET_ACTIVITY frame to Discord Desktop!" << std::endl;
        CloseHandle(hPipe);
    } else {
        std::cout << "ℹ️  [C++ Helper] Discord Desktop not running locally. Continuing background simulation." << std::endl;
    }
#else
    std::cout << "ℹ️  [C++ Helper] Non-Windows environment. Running sleeper simulation." << std::endl;
#endif
}

int main(int argc, char* argv[]) {
    std::string appId = "1098679090623692880";
    std::string gameName = "Valorant";
    std::string exeName = "VALORANT.exe";
    int durationSeconds = 900;

    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        if (arg == "--app-id" && i + 1 < argc) appId = argv[++i];
        else if (arg == "--game-name" && i + 1 < argc) gameName = argv[++i];
        else if (arg == "--exe" && i + 1 < argc) exeName = argv[++i];
        else if (arg == "--duration" && i + 1 < argc) durationSeconds = std::stoi(argv[++i]);
    }

    std::cout << "============================================================" << std::endl;
    std::cout << "   ⚡ HYPER AUTO FARM QUEST - C++ NATIVE ENGINE v3.0.0 ⚡   " << std::endl;
    std::cout << "    Markterence Dummy Game Engine & Windows Named Pipe IPC  " << std::endl;
    std::cout << "============================================================" << std::endl;
    std::cout << "🎯 Target App ID : " << appId << std::endl;
    std::cout << "🎮 Target Game   : " << gameName << " (" << exeName << ")" << std::endl;
    std::cout << "⏱  Duration      : " << durationSeconds << " seconds" << std::endl;

    // Connect and notify Discord IPC
    SendNamedPipeActivity(appId, gameName);

    // Run game simulation
    int elapsed = 0;
    const int step = 10;
    while (elapsed < durationSeconds) {
        std::this_thread::sleep_for(std::chrono::seconds(step));
        elapsed += step;
        std::cout << "⏱ [C++ Helper] Progress: " << elapsed << "/" << durationSeconds 
                  << "s (" << (elapsed * 100) / durationSeconds << "%)" << std::endl;
    }

    std::cout << "✨ [C++ Helper] Activity simulation completed successfully." << std::endl;
    return 0;
}
