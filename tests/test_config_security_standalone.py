
import sys
import os
from unittest.mock import MagicMock, patch

# Add current directory to path so we can import 'app'
sys.path.append(os.getcwd())

# --- MOCKS START ---
# We need to mock pydantic and pydantic_settings BEFORE importing app.config

# Mock pydantic
mock_pydantic = MagicMock()

# Mock field_validator to act as a transparent decorator
# It allows us to retrieve the validation function later
def mock_field_validator(*args, **kwargs):
    def decorator(func):
        # Attach attributes to identify it if needed, but simple return is enough
        # to verify logic.
        return func
    return decorator

mock_pydantic.field_validator = mock_field_validator
sys.modules["pydantic"] = mock_pydantic

# Mock pydantic_settings
mock_pydantic_settings = MagicMock()

class MockBaseSettings:
    """Mock for BaseSettings that keeps default values from class attributes."""
    def __init__(self, **kwargs):
        # In a real Pydantic model, class attributes are fields.
        # We simply copy them to instance if they are not in kwargs.
        # We iterate over class attributes that don't start with _
        for key in dir(self.__class__):
            if key.startswith("_"):
                continue

            # Skip callables (methods)
            attr = getattr(self.__class__, key)
            if callable(attr):
                continue

            # Skip properties
            if isinstance(attr, property):
                continue

            # Skip descriptors/validators if any
            # For simplicity, catch AttributeError during set
            try:
                setattr(self, key, attr)
            except AttributeError:
                pass

mock_pydantic_settings.BaseSettings = MockBaseSettings
mock_pydantic_settings.SettingsConfigDict = MagicMock()

sys.modules["pydantic_settings"] = mock_pydantic_settings

# --- MOCKS END ---

# Patch pathlib.Path.mkdir to avoid creating directories during import
with patch("pathlib.Path.mkdir") as mock_mkdir:
    try:
        import app.config
        print("Successfully imported app.config with mocks.")
    except ImportError as e:
        print(f"Failed to import app.config: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"Error during import: {e}")
        sys.exit(1)

def verify_fix():
    print("Verifying fix...")
    Settings = app.config.Settings

    # 1. Verify default value is empty list
    # We check the class attribute directly as it represents the default
    print(f"Settings.CORS_ORIGINS (default): {Settings.CORS_ORIGINS}")
    if Settings.CORS_ORIGINS == []:
        print("SUCCESS: Default CORS_ORIGINS is empty list.")
    else:
        print(f"FAILURE: Default CORS_ORIGINS is {Settings.CORS_ORIGINS}, expected [].")
        sys.exit(1)

    # 2. Verify validator logic
    # The validator is decorated with @classmethod and @field_validator
    # With our mock, @field_validator returns the function/method directly.
    # So `parse_cors_origins` should be accessible as a class method or function.

    validator = Settings.parse_cors_origins
    print(f"Validator found: {validator}")

    # Test case 1: Comma separated string
    input_str = "http://localhost:3000,http://example.com"
    # Since it is a classmethod, we might need to pass cls if we access it via class dict,
    # but if we access via Settings.parse_cors_origins, it might be bound?
    # Wait, our mock BaseSettings doesn't do pydantic magic.
    # If it is defined as:
    # @classmethod
    # def parse_cors_origins(cls, v): ...
    # Then Settings.parse_cors_origins(v) should work if called on the class.

    try:
        result_str = validator(input_str)
        print(f"Validator input '{input_str}' -> {result_str}")
        if result_str == ["http://localhost:3000", "http://example.com"]:
            print("SUCCESS: Comma separated string parsed correctly.")
        else:
            print("FAILURE: Comma separated string parsing failed.")
            sys.exit(1)
    except Exception as e:
        # If it requires cls but wasn't bound properly?
        # python's @classmethod works standardly.
        print(f"FAILURE: Validator raised exception: {e}")
        sys.exit(1)

    # Test case 2: JSON-like string (should be preserved for Pydantic to handle or handled if logic says so)
    # The logic: if isinstance(v, str) and not v.startswith("["): split...
    # else: return v.

    input_json = '["http://foo.com"]'
    result_json = validator(input_json)
    print(f"Validator input '{input_json}' -> {result_json}")
    if result_json == input_json:
        print("SUCCESS: JSON string preserved.")
    else:
         print(f"FAILURE: JSON string not preserved (Got {result_json}).")
         sys.exit(1)

    # Test case 3: List (already parsed)
    input_list = ["http://bar.com"]
    result_list = validator(input_list)
    print(f"Validator input '{input_list}' -> {result_list}")
    if result_list == input_list:
        print("SUCCESS: List preserved.")
    else:
         print(f"FAILURE: List not preserved.")
         sys.exit(1)

    # Test case 4: Single origin string (no comma)
    input_single = "http://single.com"
    result_single = validator(input_single)
    print(f"Validator input '{input_single}' -> {result_single}")
    if result_single == ["http://single.com"]:
        print("SUCCESS: Single origin string parsed correctly.")
    else:
         print("FAILURE: Single origin string parsing failed.")
         sys.exit(1)

if __name__ == "__main__":
    verify_fix()
