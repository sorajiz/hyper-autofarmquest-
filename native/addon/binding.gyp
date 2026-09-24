{
  "targets": [
    {
      "target_name": "hyper_native",
      "sources": [ "src/tls_fingerprint.cpp" ],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "defines": [ "NAPI_DISABLE_CPP_EXCEPTIONS" ]
    }
  ]
}
