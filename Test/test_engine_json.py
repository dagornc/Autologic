
import pytest
from autologic.core.engine import AutoLogicEngine

def test_clean_json_response_with_think_tags():
    # Test case 1: <think> tags before JSON
    response = "<think>I need to provide a JSON object.</think>{\"key\": \"value\"}"
    cleaned = AutoLogicEngine._clean_json_response(response)
    assert cleaned == "{\"key\": \"value\"}"

    # Test case 2: <think> tags after JSON
    response = "{\"key\": \"value\"}<think>Job done.</think>"
    cleaned = AutoLogicEngine._clean_json_response(response)
    assert cleaned == "{\"key\": \"value\"}"

    # Test case 3: <think> tags in markdown
    response = "```json\n<think>Reasoning here</think>\n{\"key\": \"value\"}\n```"
    cleaned = AutoLogicEngine._clean_json_response(response)
    assert cleaned == "{\"key\": \"value\"}"

    # Test case 4: Malformed response with text
    response = "Here is the result: {\"key\": \"value\"} hope it helps."
    cleaned = AutoLogicEngine._clean_json_response(response)
    assert cleaned == "{\"key\": \"value\"}"

def test_clean_json_response_multiline_think():
    # Test case 5: Multiline <think> tags
    response = """<think>
    First step...
    Second step...
    </think>
    {"key": "value"}"""
    cleaned = AutoLogicEngine._clean_json_response(response)
    assert cleaned == '{"key": "value"}'

if __name__ == "__main__":
    # Simple manual run
    try:
        test_clean_json_response_with_think_tags()
        test_clean_json_response_multiline_think()
        print("JSON cleaning tests passed!")
    except AssertionError as e:
        print(f"Test failed: {e}")
