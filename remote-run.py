from flask import Flask, request
from os import path
import yaml

# Default configuration
from subprocess import Popen, PIPE

config = dict(host='127.0.0.1', port=5000)
configFile = path.dirname(path.realpath(__file__)) + "/remote-run.yaml"

# Load from local
try:
    with open(configFile, 'r') as f:
        try:
            config = yaml.load(f)
        except yaml.YAMLError as exc:
            exit(exc)
except FileNotFoundError as fnf:
    with open(configFile, 'w') as stream:
        yaml.safe_dump(config, stream)
    print("{0} not found, creating and running with default".format(configFile))

app = Flask(__name__)


@app.route('/', redirect_to='/static/index.html')
def index():
    pass


def _replace_args(args, p):
    for a in args:
        p = p.replace('{' + str(a) + '}', args[a])
    return p


@app.route('/run/<cmd>')
def run(cmd):
    # return system()
    r = [_replace_args(request.args, a) for a in config['cmd'].get(cmd)]
    print(r)
    with Popen(r, shell=True, stdout=PIPE) as proc:
        return proc.stdout.read(), 200, {'Content-Type': 'text/plain; charset=utf-8'}


if __name__ == '__main__':
    app.run(host=config['host'], port=config['port'])
