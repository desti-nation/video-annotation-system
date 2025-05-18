"""
工作状态视频数据标注系统 - 启动脚本
"""
import os
import sys
import webbrowser
from threading import Timer

def open_browser():
    """在默认浏览器中打开应用"""
    webbrowser.open('http://127.0.0.1:5000/')

if __name__ == '__main__':
    # 确保python能找到app.py
    sys.path.append(os.path.dirname(__file__))
    
    # 延迟1秒后自动打开浏览器
    Timer(1.0, open_browser).start()
    
    # 启动Flask应用
    from app import app
    app.run(debug=True, threaded=True)