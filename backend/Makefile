.PHONY: build
build:
	mkdir -p build
	GOOS=js GOARCH=wasm go build -o build/app.wasm .
	go run github.com/syumai/workers/cmd/workers-assets-gen@latest
