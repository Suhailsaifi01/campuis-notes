import os
from flask import Flask

app = Flask(__name__)

@app.route("/")
def home():
    """Base route for the Campus Notes Sharing System."""
    return "Hello World - Campus Notes Sharing System is running"

if __name__ == "__main__":
    # os.environ.get() retrieves the 'PORT' variable from the environment.
    # We use "5000" as a fallback string if the variable is not defined.
    # host="0.0.0.0" ensures the server is accessible on your local network.
    port_env = os.environ.get("PORT", "5000")
    
    print(f"Server starting on port {port_env}...")
    app.run(host="0.0.0.0", port=int(port_env))