.PHONY: validate test install dry-run

validate:
	./scripts/validate.sh

test: validate
	./tests/test-scripts.sh

install:
	./scripts/install.sh

dry-run:
	./scripts/install.sh --dry-run
