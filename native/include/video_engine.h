#pragma once

#include <string>
#include <vector>
#include <memory>
#include <functional>

extern "C" {
#include <libavcodec/avcodec.h>
#include <libavformat/avformat.h>
#include <libavutil/avutil.h>
#include <libavutil/imgutils.h>
#include <libswscale/swscale.h>
#include <libswresample/swresample.h>
}

namespace aria {

struct VideoMetadata {
    double duration;
    int width;
    int height;
    double fps;
    std::string codec;
    std::string container;
    long bitrate;
    bool hasAudio;
    int audioChannels;
    int audioSampleRate;
    std::string audioCodec;
};

struct ProxySettings {
    int width;
    int height;
    std::string videoCodec;
    std::string audioCodec;
    long videoBitrate;
    long audioBitrate;
    bool useGPU;
};

struct ExportSettings {
    int width;
    int height;
    std::string videoCodec;
    std::string audioCodec;
    long videoBitrate;
    long audioBitrate;
    std::string format;
};

using ProgressCallback = std::function<void(double progress, const std::string& message)>;

class VideoEngine {
public:
    VideoEngine();
    ~VideoEngine();

    VideoMetadata getMetadata(const std::string& filePath);
    bool generateProxy(const std::string& inputPath, const std::string& outputPath, const ProxySettings& settings, ProgressCallback callback = nullptr);
    bool exportVideo(const std::string& inputPath, const std::string& outputPath, const ExportSettings& settings, ProgressCallback callback = nullptr);
    bool convertVideo(const std::string& inputPath, const std::string& outputPath, const ExportSettings& settings, ProgressCallback callback = nullptr);
    std::vector<uint8_t> renderFrame(const std::string& filePath, double timestamp, int width, int height);

    static std::string getError();

private:
    static std::string lastError;
    bool decodeEncodeVideo(AVFormatContext* inFmtCtx, AVFormatContext* outFmtCtx, int* streamMapping, const ExportSettings& settings, ProgressCallback callback);
    bool decodeEncodeAudio(AVFormatContext* inFmtCtx, AVFormatContext* outFmtCtx, int* streamMapping, const ExportSettings& settings, ProgressCallback callback);
};

} // namespace aria
