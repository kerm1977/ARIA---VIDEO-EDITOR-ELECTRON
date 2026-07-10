{
  "targets": [
    {
      "target_name": "video_engine",
      "sources": [
        "native/src/engine.cpp",
        "native/src/video_engine.cpp"
      ],
      "include_dirs": [
        "native/include",
        "<!@(node -e \"console.log(JSON.parse(require('node-addon-api').include))\")"
      ],
      "dependencies": [
        "<!(node -p \"require('node-addon-api').gyp\")"
      ],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "defines": ["NAPI_CPP_EXCEPTIONS"],
      "link_settings": {
        "libraries": [
          "<!@(pkg-config --libs libavcodec libavformat libavutil libswscale libswresample)"
        ]
      },
      "cflags": [
        "<!@(pkg-config --cflags libavcodec libavformat libavutil libswscale libswresample)"
      ],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++",
        "MACOSX_DEPLOYMENT_TARGET": "10.14"
      },
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": 1
        }
      }
    }
  ]
}
