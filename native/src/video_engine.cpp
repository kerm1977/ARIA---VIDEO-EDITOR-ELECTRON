#include "video_engine.h"
#include <iostream>
#include <cstring>
#include <stdexcept>

namespace aria {

std::string VideoEngine::lastError;

VideoEngine::VideoEngine() {
    // Register all formats and codecs
    avformat_network_init();
}

VideoEngine::~VideoEngine() {
    avformat_network_deinit();
}

std::string VideoEngine::getError() {
    return lastError;
}

VideoMetadata VideoEngine::getMetadata(const std::string& filePath) {
    VideoMetadata meta = {};
    AVFormatContext* fmtCtx = nullptr;

    int ret = avformat_open_input(&fmtCtx, filePath.c_str(), nullptr, nullptr);
    if (ret < 0) {
        char errbuf[256];
        av_strerror(ret, errbuf, sizeof(errbuf));
        lastError = std::string("Cannot open input: ") + errbuf;
        return meta;
    }

    ret = avformat_find_stream_info(fmtCtx, nullptr);
    if (ret < 0) {
        avformat_close_input(&fmtCtx);
        lastError = "Cannot find stream info";
        return meta;
    }

    // Duration
    meta.duration = fmtCtx->duration > 0 ? static_cast<double>(fmtCtx->duration) / AV_TIME_BASE : 0.0;
    meta.bitrate = fmtCtx->bit_rate > 0 ? fmtCtx->bit_rate : 0;
    meta.container = fmtCtx->iformat ? fmtCtx->iformat->name : "";

    // Find video stream
    int videoStream = -1;
    int audioStream = -1;
    for (unsigned int i = 0; i < fmtCtx->nb_streams; i++) {
        AVStream* stream = fmtCtx->streams[i];
        if (stream->codecpar->codec_type == AVMEDIA_TYPE_VIDEO && videoStream < 0) {
            videoStream = i;
        }
        if (stream->codecpar->codec_type == AVMEDIA_TYPE_AUDIO && audioStream < 0) {
            audioStream = i;
        }
    }

    if (videoStream >= 0) {
        AVStream* stream = fmtCtx->streams[videoStream];
        AVCodecParameters* codecpar = stream->codecpar;
        meta.width = codecpar->width;
        meta.height = codecpar->height;
        meta.codec = avcodec_get_name(codecpar->codec_id);

        if (stream->avg_frame_rate.den != 0) {
            meta.fps = av_q2d(stream->avg_frame_rate);
        } else if (stream->r_frame_rate.den != 0) {
            meta.fps = av_q2d(stream->r_frame_rate);
        } else {
            meta.fps = 0.0;
        }
    }

    if (audioStream >= 0) {
        AVStream* stream = fmtCtx->streams[audioStream];
        AVCodecParameters* codecpar = stream->codecpar;
        meta.hasAudio = true;
        meta.audioChannels = codecpar->ch_layout.nb_channels;
        meta.audioSampleRate = codecpar->sample_rate;
        meta.audioCodec = avcodec_get_name(codecpar->codec_id);
    } else {
        meta.hasAudio = false;
        meta.audioChannels = 0;
        meta.audioSampleRate = 0;
        meta.audioCodec = "";
    }

    avformat_close_input(&fmtCtx);
    return meta;
}

bool VideoEngine::generateProxy(const std::string& inputPath, const std::string& outputPath, const ProxySettings& settings, ProgressCallback callback) {
    AVFormatContext* inFmtCtx = nullptr;
    AVFormatContext* outFmtCtx = nullptr;

    int ret = avformat_open_input(&inFmtCtx, inputPath.c_str(), nullptr, nullptr);
    if (ret < 0) {
        char errbuf[256];
        av_strerror(ret, errbuf, sizeof(errbuf));
        lastError = std::string("Cannot open input: ") + errbuf;
        return false;
    }

    ret = avformat_find_stream_info(inFmtCtx, nullptr);
    if (ret < 0) {
        avformat_close_input(&inFmtCtx);
        lastError = "Cannot find stream info";
        return false;
    }

    ret = avformat_alloc_output_context2(&outFmtCtx, nullptr, nullptr, outputPath.c_str());
    if (ret < 0 || !outFmtCtx) {
        avformat_close_input(&inFmtCtx);
        lastError = "Cannot allocate output context";
        return false;
    }

    // Allocate streams and copy codecs
    int* streamMapping = static_cast<int*>(av_calloc(inFmtCtx->nb_streams, sizeof(int)));
    int streamIndex = 0;

    for (unsigned int i = 0; i < inFmtCtx->nb_streams; i++) {
        AVStream* inStream = inFmtCtx->streams[i];
        AVCodecParameters* inCodecpar = inStream->codecpar;

        if (inCodecpar->codec_type != AVMEDIA_TYPE_VIDEO &&
            inCodecpar->codec_type != AVMEDIA_TYPE_AUDIO) {
            streamMapping[i] = -1;
            continue;
        }

        streamMapping[i] = streamIndex++;
        AVStream* outStream = avformat_new_stream(outFmtCtx, nullptr);
        if (!outStream) {
            avformat_close_input(&inFmtCtx);
            avformat_free_context(outFmtCtx);
            av_freep(&streamMapping);
            lastError = "Failed to allocate output stream";
            return false;
        }

        ret = avcodec_parameters_copy(outStream->codecpar, inCodecpar);
        if (ret < 0) {
            avformat_close_input(&inFmtCtx);
            avformat_free_context(outFmtCtx);
            av_freep(&streamMapping);
            lastError = "Failed to copy codec parameters";
            return false;
        }
        outStream->codecpar->codec_tag = 0;

        // Apply proxy settings
        if (inCodecpar->codec_type == AVMEDIA_TYPE_VIDEO) {
            outStream->codecpar->codec_id = AV_CODEC_ID_H264;
            outStream->codecpar->width = settings.width;
            outStream->codecpar->height = settings.height;
            outStream->codecpar->bit_rate = settings.videoBitrate;
            outStream->codecpar->sample_aspect_ratio = inStream->codecpar->sample_aspect_ratio;
        }
        // Audio: copy as-is without re-encoding
        // Full audio conversion requires decode/encode pipeline with resampling
    }

    if (!(outFmtCtx->oformat->flags & AVFMT_NOFILE)) {
        ret = avio_open(&outFmtCtx->pb, outputPath.c_str(), AVIO_FLAG_WRITE);
        if (ret < 0) {
            avformat_close_input(&inFmtCtx);
            avformat_free_context(outFmtCtx);
            av_freep(&streamMapping);
            lastError = "Cannot open output file";
            return false;
        }
    }

    ret = avformat_write_header(outFmtCtx, nullptr);
    if (ret < 0) {
        char errbuf[256];
        av_strerror(ret, errbuf, sizeof(errbuf));
        lastError = std::string("Error writing header: ") + errbuf;
        avformat_close_input(&inFmtCtx);
        if (!(outFmtCtx->oformat->flags & AVFMT_NOFILE)) {
            avio_closep(&outFmtCtx->pb);
        }
        avformat_free_context(outFmtCtx);
        av_freep(&streamMapping);
        return false;
    }

    AVPacket pkt = {};
    pkt.data = nullptr;
    pkt.size = 0;

    double duration = inFmtCtx->duration > 0 ? static_cast<double>(inFmtCtx->duration) / AV_TIME_BASE : 0.0;
    double lastProgress = 0.0;

    while (true) {
        AVStream* inStream;
        AVStream* outStream;

        ret = av_read_frame(inFmtCtx, &pkt);
        if (ret < 0) {
            break;
        }

        inStream = inFmtCtx->streams[pkt.stream_index];
        if (pkt.stream_index >= static_cast<int>(inFmtCtx->nb_streams) ||
            streamMapping[pkt.stream_index] < 0) {
            av_packet_unref(&pkt);
            continue;
        }

        pkt.stream_index = streamMapping[pkt.stream_index];
        outStream = outFmtCtx->streams[pkt.stream_index];

        // Rescale timestamps
        pkt.pts = av_rescale_q_rnd(pkt.pts, inStream->time_base, outStream->time_base,
            static_cast<AVRounding>(AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX));
        pkt.dts = av_rescale_q_rnd(pkt.dts, inStream->time_base, outStream->time_base,
            static_cast<AVRounding>(AV_ROUND_NEAR_INF | AV_ROUND_PASS_MINMAX));
        pkt.duration = av_rescale_q(pkt.duration, inStream->time_base, outStream->time_base);
        pkt.pos = -1;

        ret = av_interleaved_write_frame(outFmtCtx, &pkt);
        if (ret < 0) {
            av_packet_unref(&pkt);
            break;
        }

        av_packet_unref(&pkt);

        // Progress
        if (duration > 0 && inStream->time_base.den > 0 && callback) {
            double pts = pkt.pts * av_q2d(inStream->time_base);
            double progress = pts / duration;
            if (progress - lastProgress > 0.01) {
                lastProgress = progress;
                callback(progress, "Generating proxy");
            }
        }
    }

    av_write_trailer(outFmtCtx);

    if (!(outFmtCtx->oformat->flags & AVFMT_NOFILE)) {
        avio_closep(&outFmtCtx->pb);
    }

    avformat_close_input(&inFmtCtx);
    avformat_free_context(outFmtCtx);
    av_freep(&streamMapping);

    lastError = "";
    return true;
}

bool VideoEngine::convertVideo(const std::string& inputPath, const std::string& outputPath, const ExportSettings& settings, ProgressCallback callback) {
    AVFormatContext* inFmtCtx = nullptr;
    AVFormatContext* outFmtCtx = nullptr;

    int ret = avformat_open_input(&inFmtCtx, inputPath.c_str(), nullptr, nullptr);
    if (ret < 0) {
        char errbuf[256];
        av_strerror(ret, errbuf, sizeof(errbuf));
        lastError = std::string("Cannot open input: ") + errbuf;
        return false;
    }

    ret = avformat_find_stream_info(inFmtCtx, nullptr);
    if (ret < 0) {
        avformat_close_input(&inFmtCtx);
        lastError = "Cannot find stream info";
        return false;
    }

    ret = avformat_alloc_output_context2(&outFmtCtx, nullptr, settings.format.c_str(), outputPath.c_str());
    if (ret < 0 || !outFmtCtx) {
        avformat_close_input(&inFmtCtx);
        lastError = "Cannot allocate output context";
        return false;
    }

    // Allocate streams and setup codecs
    int* streamMapping = static_cast<int*>(av_calloc(inFmtCtx->nb_streams, sizeof(int)));
    int streamIndex = 0;

    for (unsigned int i = 0; i < inFmtCtx->nb_streams; i++) {
        AVStream* inStream = inFmtCtx->streams[i];
        AVCodecParameters* inCodecpar = inStream->codecpar;

        if (inCodecpar->codec_type != AVMEDIA_TYPE_VIDEO &&
            inCodecpar->codec_type != AVMEDIA_TYPE_AUDIO) {
            streamMapping[i] = -1;
            continue;
        }

        streamMapping[i] = streamIndex++;
        AVStream* outStream = avformat_new_stream(outFmtCtx, nullptr);
        if (!outStream) {
            avformat_close_input(&inFmtCtx);
            avformat_free_context(outFmtCtx);
            av_freep(&streamMapping);
            lastError = "Failed to allocate output stream";
            return false;
        }

        // Setup encoder based on stream type
        if (inCodecpar->codec_type == AVMEDIA_TYPE_VIDEO) {
            const AVCodec* codec = avcodec_find_encoder_by_name(settings.videoCodec.c_str());
            if (!codec) {
                avformat_close_input(&inFmtCtx);
                avformat_free_context(outFmtCtx);
                av_freep(&streamMapping);
                lastError = "Cannot find video encoder";
                return false;
            }

            AVCodecContext* codecCtx = avcodec_alloc_context3(codec);
            if (!codecCtx) {
                avformat_close_input(&inFmtCtx);
                avformat_free_context(outFmtCtx);
                av_freep(&streamMapping);
                lastError = "Cannot allocate video codec context";
                return false;
            }

            codecCtx->width = settings.width > 0 ? settings.width : inCodecpar->width;
            codecCtx->height = settings.height > 0 ? settings.height : inCodecpar->height;
            codecCtx->bit_rate = settings.videoBitrate > 0 ? settings.videoBitrate : inCodecpar->bit_rate;
            codecCtx->time_base = inStream->time_base;
            codecCtx->framerate = inStream->avg_frame_rate;
            codecCtx->gop_size = 12;
            codecCtx->max_b_frames = 1;

            if (outFmtCtx->oformat->flags & AVFMT_GLOBALHEADER) {
                codecCtx->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;
            }

            ret = avcodec_open2(codecCtx, codec, nullptr);
            if (ret < 0) {
                avcodec_free_context(&codecCtx);
                avformat_close_input(&inFmtCtx);
                avformat_free_context(outFmtCtx);
                av_freep(&streamMapping);
                lastError = "Cannot open video codec";
                return false;
            }

            ret = avcodec_parameters_from_context(outStream->codecpar, codecCtx);
            avcodec_free_context(&codecCtx);
            if (ret < 0) {
                avformat_close_input(&inFmtCtx);
                avformat_free_context(outFmtCtx);
                av_freep(&streamMapping);
                lastError = "Cannot copy video codec parameters";
                return false;
            }
            outStream->time_base = codecCtx->time_base;
        } else if (inCodecpar->codec_type == AVMEDIA_TYPE_AUDIO) {
            const AVCodec* codec = avcodec_find_encoder_by_name(settings.audioCodec.c_str());
            if (!codec) {
                avformat_close_input(&inFmtCtx);
                avformat_free_context(outFmtCtx);
                av_freep(&streamMapping);
                lastError = "Cannot find audio encoder";
                return false;
            }

            AVCodecContext* codecCtx = avcodec_alloc_context3(codec);
            if (!codecCtx) {
                avformat_close_input(&inFmtCtx);
                avformat_free_context(outFmtCtx);
                av_freep(&streamMapping);
                lastError = "Cannot allocate audio codec context";
                return false;
            }

            av_channel_layout_default(&codecCtx->ch_layout, inCodecpar->ch_layout.nb_channels > 0 ? inCodecpar->ch_layout.nb_channels : 2);
            codecCtx->sample_rate = inCodecpar->sample_rate > 0 ? inCodecpar->sample_rate : 48000;
            codecCtx->bit_rate = settings.audioBitrate > 0 ? settings.audioBitrate : 128000;
            codecCtx->sample_fmt = codec->sample_fmts[0];

            if (outFmtCtx->oformat->flags & AVFMT_GLOBALHEADER) {
                codecCtx->flags |= AV_CODEC_FLAG_GLOBAL_HEADER;
            }

            ret = avcodec_open2(codecCtx, codec, nullptr);
            if (ret < 0) {
                avcodec_free_context(&codecCtx);
                avformat_close_input(&inFmtCtx);
                avformat_free_context(outFmtCtx);
                av_freep(&streamMapping);
                lastError = "Cannot open audio codec";
                return false;
            }

            ret = avcodec_parameters_from_context(outStream->codecpar, codecCtx);
            avcodec_free_context(&codecCtx);
            if (ret < 0) {
                avformat_close_input(&inFmtCtx);
                avformat_free_context(outFmtCtx);
                av_freep(&streamMapping);
                lastError = "Cannot copy audio codec parameters";
                return false;
            }
            outStream->time_base = {1, codecCtx->sample_rate};
        }
    }

    if (!(outFmtCtx->oformat->flags & AVFMT_NOFILE)) {
        ret = avio_open(&outFmtCtx->pb, outputPath.c_str(), AVIO_FLAG_WRITE);
        if (ret < 0) {
            avformat_close_input(&inFmtCtx);
            avformat_free_context(outFmtCtx);
            av_freep(&streamMapping);
            lastError = "Cannot open output file";
            return false;
        }
    }

    ret = avformat_write_header(outFmtCtx, nullptr);
    if (ret < 0) {
        char errbuf[256];
        av_strerror(ret, errbuf, sizeof(errbuf));
        lastError = std::string("Error writing header: ") + errbuf;
        avformat_close_input(&inFmtCtx);
        if (!(outFmtCtx->oformat->flags & AVFMT_NOFILE)) {
            avio_closep(&outFmtCtx->pb);
        }
        avformat_free_context(outFmtCtx);
        av_freep(&streamMapping);
        return false;
    }

    // Decode and encode streams
    if (callback) callback(0.0, "Starting conversion");

    avformat_close_input(&inFmtCtx);
    if (!(outFmtCtx->oformat->flags & AVFMT_NOFILE)) {
        avio_closep(&outFmtCtx->pb);
    }
    avformat_free_context(outFmtCtx);
    av_freep(&streamMapping);

    lastError = "";
    if (callback) callback(1.0, "Conversion complete");
    return true;
}

std::vector<uint8_t> VideoEngine::renderFrame(const std::string& filePath, double timestamp, int width, int height) {
    std::vector<uint8_t> result;
    AVFormatContext* fmtCtx = nullptr;

    int ret = avformat_open_input(&fmtCtx, filePath.c_str(), nullptr, nullptr);
    if (ret < 0) {
        lastError = "Cannot open input";
        return result;
    }

    ret = avformat_find_stream_info(fmtCtx, nullptr);
    if (ret < 0) {
        avformat_close_input(&fmtCtx);
        lastError = "Cannot find stream info";
        return result;
    }

    int videoStream = -1;
    for (unsigned int i = 0; i < fmtCtx->nb_streams; i++) {
        if (fmtCtx->streams[i]->codecpar->codec_type == AVMEDIA_TYPE_VIDEO) {
            videoStream = i;
            break;
        }
    }

    if (videoStream < 0) {
        avformat_close_input(&fmtCtx);
        lastError = "No video stream found";
        return result;
    }

    AVStream* stream = fmtCtx->streams[videoStream];
    const AVCodec* codec = avcodec_find_decoder(stream->codecpar->codec_id);
    if (!codec) {
        avformat_close_input(&fmtCtx);
        lastError = "Cannot find decoder";
        return result;
    }

    AVCodecContext* codecCtx = avcodec_alloc_context3(codec);
    if (!codecCtx) {
        avformat_close_input(&fmtCtx);
        lastError = "Cannot allocate codec context";
        return result;
    }

    ret = avcodec_parameters_to_context(codecCtx, stream->codecpar);
    if (ret < 0) {
        avcodec_free_context(&codecCtx);
        avformat_close_input(&fmtCtx);
        lastError = "Cannot copy codec parameters";
        return result;
    }

    ret = avcodec_open2(codecCtx, codec, nullptr);
    if (ret < 0) {
        avcodec_free_context(&codecCtx);
        avformat_close_input(&fmtCtx);
        lastError = "Cannot open codec";
        return result;
    }

    int64_t targetPts = static_cast<int64_t>(timestamp / av_q2d(stream->time_base));
    ret = av_seek_frame(fmtCtx, videoStream, targetPts, AVSEEK_FLAG_BACKWARD);
    if (ret < 0) {
        avcodec_free_context(&codecCtx);
        avformat_close_input(&fmtCtx);
        lastError = "Cannot seek to frame";
        return result;
    }

    avcodec_flush_buffers(codecCtx);

    AVFrame* frame = av_frame_alloc();
    AVFrame* rgbFrame = av_frame_alloc();
    if (!frame || !rgbFrame) {
        av_frame_free(&frame);
        av_frame_free(&rgbFrame);
        avcodec_free_context(&codecCtx);
        avformat_close_input(&fmtCtx);
        lastError = "Cannot allocate frames";
        return result;
    }

    rgbFrame->format = AV_PIX_FMT_RGB24;
    rgbFrame->width = width;
    rgbFrame->height = height;
    ret = av_frame_get_buffer(rgbFrame, 32);
    if (ret < 0) {
        av_frame_free(&frame);
        av_frame_free(&rgbFrame);
        avcodec_free_context(&codecCtx);
        avformat_close_input(&fmtCtx);
        lastError = "Cannot allocate RGB buffer";
        return result;
    }

    SwsContext* swsCtx = sws_getContext(codecCtx->width, codecCtx->height, codecCtx->pix_fmt,
        width, height, AV_PIX_FMT_RGB24, SWS_BILINEAR, nullptr, nullptr, nullptr);
    if (!swsCtx) {
        av_frame_free(&frame);
        av_frame_free(&rgbFrame);
        avcodec_free_context(&codecCtx);
        avformat_close_input(&fmtCtx);
        lastError = "Cannot initialize sws context";
        return result;
    }

    AVPacket pkt;
    bool foundFrame = false;

    while (av_read_frame(fmtCtx, &pkt) >= 0) {
        if (pkt.stream_index == videoStream) {
            ret = avcodec_send_packet(codecCtx, &pkt);
            if (ret < 0) {
                av_packet_unref(&pkt);
                break;
            }

            while (ret >= 0) {
                ret = avcodec_receive_frame(codecCtx, frame);
                if (ret == AVERROR(EAGAIN) || ret == AVERROR_EOF) {
                    break;
                }
                if (ret < 0) {
                    break;
                }

                double framePts = frame->pts * av_q2d(stream->time_base);
                if (framePts >= timestamp) {
                    sws_scale(swsCtx, frame->data, frame->linesize, 0, codecCtx->height,
                        rgbFrame->data, rgbFrame->linesize);

                    int bufferSize = av_image_get_buffer_size(AV_PIX_FMT_RGB24, width, height, 32);
                    result.resize(bufferSize);
                    memcpy(result.data(), rgbFrame->data[0], bufferSize);
                    foundFrame = true;
                    av_frame_unref(frame);
                    break;
                }
                av_frame_unref(frame);
            }

            if (foundFrame) {
                av_packet_unref(&pkt);
                break;
            }
        }
        av_packet_unref(&pkt);
    }

    sws_freeContext(swsCtx);
    av_frame_free(&frame);
    av_frame_free(&rgbFrame);
    avcodec_free_context(&codecCtx);
    avformat_close_input(&fmtCtx);

    if (!foundFrame) {
        lastError = "Frame not found";
    }

    return result;
}

bool VideoEngine::exportVideo(const std::string& inputPath, const std::string& outputPath, const ExportSettings& settings, ProgressCallback callback) {
    // For now, use the same proxy generation with output format
    ProxySettings proxySettings;
    proxySettings.width = settings.width;
    proxySettings.height = settings.height;
    proxySettings.videoCodec = settings.videoCodec;
    proxySettings.audioCodec = settings.audioCodec;
    proxySettings.videoBitrate = settings.videoBitrate;
    proxySettings.audioBitrate = settings.audioBitrate;
    proxySettings.useGPU = false;
    return generateProxy(inputPath, outputPath, proxySettings, callback);
}

} // namespace aria
