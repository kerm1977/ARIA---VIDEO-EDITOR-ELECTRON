#include <napi.h>
#include "video_engine.h"
#include <string>

using namespace aria;

Napi::Object MetadataToObject(Napi::Env env, const VideoMetadata& meta) {
    Napi::Object obj = Napi::Object::New(env);
    obj.Set("duration", meta.duration);
    obj.Set("width", meta.width);
    obj.Set("height", meta.height);
    obj.Set("fps", meta.fps);
    obj.Set("codec", meta.codec);
    obj.Set("container", meta.container);
    obj.Set("bitrate", meta.bitrate);
    obj.Set("hasAudio", meta.hasAudio);
    obj.Set("audioChannels", meta.audioChannels);
    obj.Set("audioSampleRate", meta.audioSampleRate);
    obj.Set("audioCodec", meta.audioCodec);
    return obj;
}

ProxySettings ObjectToProxySettings(const Napi::Object& obj) {
    ProxySettings settings;
    settings.width = obj.Has("width") ? obj.Get("width").As<Napi::Number>().Int32Value() : 1280;
    settings.height = obj.Has("height") ? obj.Get("height").As<Napi::Number>().Int32Value() : 720;
    settings.videoCodec = obj.Has("videoCodec") ? obj.Get("videoCodec").As<Napi::String>().Utf8Value() : "h264";
    settings.audioCodec = obj.Has("audioCodec") ? obj.Get("audioCodec").As<Napi::String>().Utf8Value() : "aac";
    settings.videoBitrate = obj.Has("videoBitrate") ? obj.Get("videoBitrate").As<Napi::Number>().Int64Value() : 2000000;
    settings.audioBitrate = obj.Has("audioBitrate") ? obj.Get("audioBitrate").As<Napi::Number>().Int64Value() : 128000;
    settings.useGPU = obj.Has("useGPU") ? obj.Get("useGPU").As<Napi::Boolean>().Value() : false;
    return settings;
}

ExportSettings ObjectToExportSettings(const Napi::Object& obj) {
    ExportSettings settings;
    settings.width = obj.Has("width") ? obj.Get("width").As<Napi::Number>().Int32Value() : 1280;
    settings.height = obj.Has("height") ? obj.Get("height").As<Napi::Number>().Int32Value() : 720;
    settings.videoCodec = obj.Has("videoCodec") ? obj.Get("videoCodec").As<Napi::String>().Utf8Value() : "h264";
    settings.audioCodec = obj.Has("audioCodec") ? obj.Get("audioCodec").As<Napi::String>().Utf8Value() : "aac";
    settings.videoBitrate = obj.Has("videoBitrate") ? obj.Get("videoBitrate").As<Napi::Number>().Int64Value() : 2000000;
    settings.audioBitrate = obj.Has("audioBitrate") ? obj.Get("audioBitrate").As<Napi::Number>().Int64Value() : 128000;
    settings.format = obj.Has("format") ? obj.Get("format").As<Napi::String>().Utf8Value() : "mp4";
    return settings;
}

class ProxyAsyncWorker : public Napi::AsyncWorker {
public:
    ProxyAsyncWorker(Napi::Function& callback, const std::string& inputPath, const std::string& outputPath, const ProxySettings& settings)
        : Napi::AsyncWorker(callback), inputPath_(inputPath), outputPath_(outputPath), settings_(settings), success_(false) {}

    void Execute() override {
        VideoEngine engine;
        success_ = engine.generateProxy(inputPath_, outputPath_, settings_, nullptr);
        if (!success_) {
            error_ = VideoEngine::getError();
        }
    }

    void OnOK() override {
        Napi::HandleScope scope(Env());
        if (success_) {
            Callback().Call({Env().Null(), Napi::String::New(Env(), outputPath_)});
        } else {
            Callback().Call({Napi::Error::New(Env(), error_).Value(), Env().Null()});
        }
    }

private:
    std::string inputPath_;
    std::string outputPath_;
    ProxySettings settings_;
    bool success_;
    std::string error_;
};

class ConvertAsyncWorker : public Napi::AsyncWorker {
public:
    ConvertAsyncWorker(Napi::Function& callback, const std::string& inputPath, const std::string& outputPath, const ExportSettings& settings)
        : Napi::AsyncWorker(callback), inputPath_(inputPath), outputPath_(outputPath), settings_(settings), success_(false) {}

    void Execute() override {
        VideoEngine engine;
        success_ = engine.convertVideo(inputPath_, outputPath_, settings_, nullptr);
        if (!success_) {
            error_ = VideoEngine::getError();
        }
    }

    void OnOK() override {
        Napi::HandleScope scope(Env());
        if (success_) {
            Callback().Call({Env().Null(), Napi::String::New(Env(), outputPath_)});
        } else {
            Callback().Call({Napi::Error::New(Env(), error_).Value(), Env().Null()});
        }
    }

private:
    std::string inputPath_;
    std::string outputPath_;
    ExportSettings settings_;
    bool success_;
    std::string error_;
};

Napi::Value GetMetadata(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 1 || !info[0].IsString()) {
        Napi::TypeError::New(env, "String expected").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string filePath = info[0].As<Napi::String>().Utf8Value();
    VideoEngine engine;
    VideoMetadata meta = engine.getMetadata(filePath);

    if (meta.codec.empty() && !VideoEngine::getError().empty()) {
        Napi::Error::New(env, VideoEngine::getError()).ThrowAsJavaScriptException();
        return env.Null();
    }

    return MetadataToObject(env, meta);
}

Napi::Value GenerateProxy(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsString() || !info[1].IsString() || !info[2].IsObject()) {
        Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string inputPath = info[0].As<Napi::String>().Utf8Value();
    std::string outputPath = info[1].As<Napi::String>().Utf8Value();
    ProxySettings settings = ObjectToProxySettings(info[2].As<Napi::Object>());

    Napi::Function callback = info[3].IsFunction() ? info[3].As<Napi::Function>() : Napi::Function::New(env, [](const Napi::CallbackInfo&){});

    ProxyAsyncWorker* worker = new ProxyAsyncWorker(callback, inputPath, outputPath, settings);
    worker->Queue();

    return env.Undefined();
}

Napi::Value RenderFrame(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 4 || !info[0].IsString() || !info[1].IsNumber() || !info[2].IsNumber() || !info[3].IsNumber()) {
        Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string filePath = info[0].As<Napi::String>().Utf8Value();
    double timestamp = info[1].As<Napi::Number>().DoubleValue();
    int width = info[2].As<Napi::Number>().Int32Value();
    int height = info[3].As<Napi::Number>().Int32Value();

    VideoEngine engine;
    std::vector<uint8_t> data = engine.renderFrame(filePath, timestamp, width, height);

    if (data.empty()) {
        Napi::Error::New(env, VideoEngine::getError()).ThrowAsJavaScriptException();
        return env.Null();
    }

    return Napi::Buffer<uint8_t>::Copy(env, data.data(), data.size());
}

Napi::Value ConvertVideo(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (info.Length() < 3 || !info[0].IsString() || !info[1].IsString() || !info[2].IsObject()) {
        Napi::TypeError::New(env, "Invalid arguments").ThrowAsJavaScriptException();
        return env.Null();
    }

    std::string inputPath = info[0].As<Napi::String>().Utf8Value();
    std::string outputPath = info[1].As<Napi::String>().Utf8Value();
    ExportSettings settings = ObjectToExportSettings(info[2].As<Napi::Object>());

    Napi::Function callback = info[3].IsFunction() ? info[3].As<Napi::Function>() : Napi::Function::New(env, [](const Napi::CallbackInfo&){});

    ConvertAsyncWorker* worker = new ConvertAsyncWorker(callback, inputPath, outputPath, settings);
    worker->Queue();

    return env.Undefined();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("getMetadata", Napi::Function::New(env, GetMetadata));
    exports.Set("generateProxy", Napi::Function::New(env, GenerateProxy));
    exports.Set("renderFrame", Napi::Function::New(env, RenderFrame));
    exports.Set("convertVideo", Napi::Function::New(env, ConvertVideo));
    return exports;
}

NODE_API_MODULE(video_engine, Init)
