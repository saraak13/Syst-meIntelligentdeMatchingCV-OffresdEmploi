import base64
import os
import cv2
import numpy as np
from deepface import DeepFace

class FaceService:
    @staticmethod
    def decode_base64_image(base64_string: str):
        """Converts frontend webcam base64 frames back into a native OpenCV image matrix."""
        try:
            if "," in base64_string:
                base64_string = base64_string.split(",")[1]
            img_data = base64.b64decode(base64_string)
            nparr = np.frombuffer(img_data, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img
        except Exception as e:
            raise ValueError(f"Failed to process image payload stream: {str(e)}")

    @staticmethod
    def verify_face(captured_img, baseline_img_path: str) -> bool:
        """
        Extracts deep feature representations using DeepFace models and verifies 
        if the faces match based on cosine distance metrics.
        """
        # 💡 FIX: Checked 'baseline_img_path' correctly instead of the old variable typo!
        if baseline_img_path is None or not os.path.exists(baseline_img_path):
            print(f"Verification aborted: Stored reference path does not exist: {baseline_img_path}")
            return False

        try:
            # Run deep representation matching verification
            result = DeepFace.verify(
                img1_path=captured_img, 
                img2_path=baseline_img_path, 
                model_name="VGG-Face", 
                enforce_detection=False 
            )
            
            return result.get("verified", False)

        except Exception as e:
            print(f"DeepFace matching exception: {str(e)}. Using fallback comparison.")
            baseline_img = cv2.imread(baseline_img_path)
            if baseline_img is None:
                return False
                
            hist1 = cv2.calcHist([captured_img], [0], None, [256], [0, 256])
            hist2 = cv2.calcHist([baseline_img], [0], None, [256], [0, 256])
            similarity = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
            return similarity > 0.70
            
    @staticmethod

    def find_face(captured_img, db_faces_dir: str):
        """
        Scans an entire directory of baseline portraits to find a match 
        for the live captured frame array. Returns the matched filename if found.
        """
        if not os.path.exists(db_faces_dir) or not os.listdir(db_faces_dir):
            return None

        try:
            # DeepFace.find returns a list of pandas dataframes matching the target
            results = DeepFace.find(
                img_path=captured_img,
                db_path=db_faces_dir,
                model_name="VGG-Face",
                enforce_detection=False,
                silent=True
            )
            
            if results and not results[0].empty:
                # Get the absolute file path of the best matching identity match
                matched_path = results[0].iloc[0]['identity']
                # Extract just the filename (e.g., "sara_at_gmail_com.jpg")
                return os.path.basename(matched_path)
                
            return None
        except Exception as e:
            print(f"DeepFace identity discovery exception: {str(e)}")
            return None