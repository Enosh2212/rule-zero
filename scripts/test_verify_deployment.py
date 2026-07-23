import subprocess
import sys
import unittest

from scripts.verify_deployment import base_url, origin


class DeploymentValidatorTests(unittest.TestCase):
    def test_url_normalization(self) -> None:
        self.assertEqual(base_url("https://frontend.example/"), "https://frontend.example")
        self.assertEqual(origin("https://frontend.example/path"), "https://frontend.example")
        with self.assertRaises(ValueError):
            base_url("frontend.example")

    def test_help_succeeds(self) -> None:
        result = subprocess.run(
            [sys.executable, "scripts/verify_deployment.py", "--help"],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0)
        self.assertIn("--frontend-url", result.stdout)
        self.assertIn("--backend-url", result.stdout)

    def test_unavailable_targets_fail_nonzero_without_sensitive_output(self) -> None:
        result = subprocess.run(
            [
                sys.executable,
                "scripts/verify_deployment.py",
                "--frontend-url",
                "http://127.0.0.1:1",
                "--backend-url",
                "http://127.0.0.1:1",
                "--timeout",
                "0.1",
            ],
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 1)
        self.assertIn("FAIL", result.stdout)
        self.assertNotIn("SIGNING_KEY=", result.stdout)


if __name__ == "__main__":
    unittest.main()
