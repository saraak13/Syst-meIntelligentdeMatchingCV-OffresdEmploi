import sys
sys.path.append('.')
from utils.llm_extractor import cv_to_json_llm
try:
    res = cv_to_json_llm('../bibliographie_CV_Matching.pdf')
    print("Success:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
