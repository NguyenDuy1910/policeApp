SHELL := /bin/bash
.DEFAULT_GOAL := run

IOS_DEVICE ?= iPhone 16 Pro
# Derived from the generated workspace; Expo names it after app.json "name" on first prebuild.
IOS_SCHEME = $(basename $(notdir $(firstword $(wildcard apps/mobile/ios/*.xcworkspace))))
IOS_CONFIGURATION ?= Debug
IOS_BUNDLE_ID := vn.gov.demo.vnpolicecare
IOS_BUILD_DIR := $(CURDIR)/apps/mobile/ios/build
IOS_API_URL ?= http://127.0.0.1:3000/api
IOS_LATITUDE ?= 9.1769
IOS_LONGITUDE ?= 105.1524

.PHONY: setup run reset build test android-apk apk ios ios-release ios-simulator ios-xcode help

setup:
	@command -v node >/dev/null 2>&1 || { echo "Node.js 22+ is required."; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "npm 10+ is required."; exit 1; }
	npm install
	@for app in server admin mobile; do \
		if [[ ! -f "apps/$$app/.env" ]]; then \
			cp "apps/$$app/.env.example" "apps/$$app/.env"; \
			echo "Created apps/$$app/.env"; \
		fi; \
	done
	npm run build -w @vnpolice/shared
	npm run db:migrate -w @vnpolice/server
	npm run db:seed -w @vnpolice/server
	@echo "Setup complete."

reset:
	@command -v node >/dev/null 2>&1 || { echo "Node.js 22+ is required."; exit 1; }
	@for app in server admin mobile; do \
		if [[ ! -f "apps/$$app/.env" ]]; then \
			cp "apps/$$app/.env.example" "apps/$$app/.env"; \
			echo "Created apps/$$app/.env"; \
		fi; \
	done
	npm run db:reset

run: setup
	@set -euo pipefail; \
	pids=(); \
	cleanup() { \
		trap - EXIT INT TERM; \
		if (( $${#pids[@]} > 0 )); then \
			kill "$${pids[@]}" 2>/dev/null || true; \
			wait "$${pids[@]}" 2>/dev/null || true; \
		fi; \
	}; \
	trap cleanup EXIT INT TERM; \
	npm run dev -w @vnpolice/server & pids+=($$!); \
	npm run dev -w @vnpolice/admin & pids+=($$!); \
	npm run start -w @vnpolice/mobile & pids+=($$!); \
	echo "Starting API, admin dashboard, and native mobile bundler. Press Ctrl+C to stop all services."; \
	echo "API:   http://localhost:3000/api"; \
	echo "Admin: http://localhost:5173"; \
	wait

build:
	npm run build

test:
	npm test
android-apk apk: setup
	cd apps/mobile && CI=1 npx expo prebuild --platform android --clean --no-install
	cd apps/mobile/android && ./gradlew assembleRelease
	@echo "APK: apps/mobile/android/app/build/outputs/apk/release/app-release.apk"

ios: setup
	cd apps/mobile && npx expo prebuild --platform ios
	$(MAKE) ios-simulator IOS_CONFIGURATION=Debug

ios-release: setup
	cd apps/mobile && npx expo prebuild --platform ios
	$(MAKE) ios-simulator IOS_CONFIGURATION=Release

ios-simulator:
	@[[ -n "$(IOS_SCHEME)" ]] || { echo "No iOS workspace found; run make ios first."; exit 1; }
	cd apps/mobile/ios && EXPO_PUBLIC_API_URL="$(IOS_API_URL)" xcodebuild -workspace "$(IOS_SCHEME).xcworkspace" -scheme "$(IOS_SCHEME)" -configuration $(IOS_CONFIGURATION) -sdk iphonesimulator -destination 'platform=iOS Simulator,name=$(IOS_DEVICE)' -derivedDataPath build build
	@xcrun simctl boot "$(IOS_DEVICE)" 2>/dev/null || true
	xcrun simctl bootstatus "$(IOS_DEVICE)" -b
	@xcrun simctl location "$(IOS_DEVICE)" set "$(IOS_LATITUDE),$(IOS_LONGITUDE)"
	@# The .app is named after PRODUCT_NAME, which prebuild updates from app.json "name" while the scheme keeps its original name.
	@set -euo pipefail; \
	app_name=$$(cd apps/mobile/ios && xcodebuild -workspace "$(IOS_SCHEME).xcworkspace" -scheme "$(IOS_SCHEME)" -configuration $(IOS_CONFIGURATION) -sdk iphonesimulator -derivedDataPath build -showBuildSettings 2>/dev/null | awk -F' = ' '/^ *WRAPPER_NAME = /{print $$2; exit}'); \
	[[ -n "$$app_name" ]] || { echo "Could not resolve the built app name."; exit 1; }; \
	echo "xcrun simctl install \"$(IOS_DEVICE)\" $$app_name"; \
	xcrun simctl install "$(IOS_DEVICE)" "$(IOS_BUILD_DIR)/Build/Products/$(IOS_CONFIGURATION)-iphonesimulator/$$app_name"
	xcrun simctl launch --terminate-running-process "$(IOS_DEVICE)" $(IOS_BUNDLE_ID)
	open -a Simulator

ios-xcode: setup
	cd apps/mobile && npx expo prebuild --platform ios
	open apps/mobile/ios/*.xcworkspace

help:
	@echo "make        Set up the workspace and run API, admin, and mobile"
	@echo "make setup  Install dependencies, create missing env files, migrate, and seed"
	@echo "make reset  Wipe all records + uploads and reload seed data (safe while the API runs)"
	@echo "make run    Same as make"
	@echo "make build  Build and type-check all workspaces"
	@echo "make android-apk  Generate the Android project and release APK"
	@echo "make ios          Build and run Debug on IOS_DEVICE=\"iPhone 16 Pro\""
	@echo "make ios-release  Build and run standalone Release on IOS_DEVICE"
	@echo "make ios-xcode    Generate and open the native Xcode workspace"
	@echo "make apk          Alias for make android-apk"
