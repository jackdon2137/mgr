import matlab.engine
from flask import Flask,url_for
from flask import render_template, request
from flask import jsonify
from flask_cors import CORS
import unicodedata
import numpy as np

app = Flask(__name__)
# app._static_folder = './static'
CORS(app)

matlab_engine = matlab.engine.start_matlab()

a = np.arange(15).reshape(3, 5)
print(a)

def normalize_unicode_string(data):
    return unicodedata.normalize('NFKD', data).encode('ascii','ignore')

@app.route("/")
def hello():
    return "Hello World!"

@app.route("/images")
def images():
        return render_template('main.html')

@app.route("/seed",methods = ['GET'])
def startSeedProcessing():    
    if request.method == 'GET':
        # payload  = request.get_json()
        image_name = normalize_unicode_string(request.args.get('fileName'))
        distance_ratio = normalize_unicode_string(request.args.get('ratio'))
        distance_type = normalize_unicode_string(request.args.get('distance'))
        neigbr_number = normalize_unicode_string(request.args.get('neighboursNumber'))
        

        output_img = matlab_engine.seed_mean_py(image_name,float(distance_ratio),distance_type,int(neigbr_number),nargout=1) 
        print('START',output_img,type(output_img),'FINISH')
        return jsonify({'result':output_img})


@app.route("/kmeans",methods = ['GET'])
def startKmeansProcessing():    
    if request.method == 'GET':
        # payload  = request.get_json()
        image_name = normalize_unicode_string(request.args.get('fileName'))
        clusters_number = normalize_unicode_string(request.args.get('clustersNumber'))
        

        n = matlab_engine.kmeans_py(image_name,float(clusters_number),nargout=0) 
        return jsonify({'result':'n'})

@app.route("/matlab")
def matlab():
    return "some matlab content"

if __name__ == "__main__":
    app.debug = True
    app.run()

