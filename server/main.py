from notebook.notebookapp import NotebookApp

if __name__ == '__main__':
    # Allow CORS requests from this origin
    NotebookApp.allow_origin = 'http://localhost:5555'
    # Path to the location of the notebooks
    NotebookApp.notebook_dir = 'server'
    # The authentication token
    NotebookApp.token = 'abc'
    # Don't open the browser when launching the notebook server
    NotebookApp.open_browser = False
    # Set port
    NotebookApp.port = 9000
    # Start the server
    NotebookApp.launch_instance()
