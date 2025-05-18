"""
工作状态视频数据标注系统 - Flask后端
"""
from flask import Flask, render_template, request, jsonify, Response, session, send_from_directory
import os
from pathlib import Path
import json
import uuid
from datetime import datetime
import re
import cv2
from moviepy.editor import VideoFileClip
import logging
from werkzeug.utils import secure_filename
import numpy as np

app = Flask(__name__, 
            static_folder="app/static",
            template_folder="app/templates")

# 设置密钥用于session
app.secret_key = 'video_annotation_system_secret_key'

# 配置
VIDEO_EXTENSIONS = {'.mp4', '.avi', '.mov', '.mkv', '.wmv'}

# 历史记录文件路径
HISTORY_FILE = 'user_history.json'

# 设置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("app.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 安全工具函数
def is_safe_path(base_path, path):
    """检查路径是否在安全的基础路径内"""
    try:
        # 规范化路径
        base_path = os.path.normpath(base_path)
        path = os.path.normpath(path)
        
        # 安全检查：确保路径在基础路径内
        return path.startswith(base_path)
    except:
        return False

def secure_filename_with_path(path):
    """为路径中的文件名部分应用安全过滤"""
    try:
        if not path:
            return None
        
        path_obj = Path(path)
        return str(path_obj.parent / secure_filename(path_obj.name))
    except:
        return None

# 读取历史记录
def get_history():
    """读取历史用户名和路径记录"""
    if os.path.exists(HISTORY_FILE):
        try:
            with open(HISTORY_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            return {"userNames": [], "videoPaths": []}
    return {"userNames": [], "videoPaths": []}

# 保存历史记录
def save_history(user_name=None, video_path=None):
    """保存用户名和路径到历史记录"""
    history = get_history()
    
    # 最多保存10条记录
    max_history = 10
    
    if user_name:
        # 移除已存在的相同名称，避免重复
        if user_name in history["userNames"]:
            history["userNames"].remove(user_name)
        # 添加到列表首位
        history["userNames"].insert(0, user_name)
        # 限制长度
        history["userNames"] = history["userNames"][:max_history]
    
    if video_path:
        # 移除已存在的相同路径，避免重复
        if video_path in history["videoPaths"]:
            history["videoPaths"].remove(video_path)
        # 添加到列表首位
        history["videoPaths"].insert(0, video_path)
        # 限制长度
        history["videoPaths"] = history["videoPaths"][:max_history]
    
    # 保存到文件
    try:
        with open(HISTORY_FILE, 'w', encoding='utf-8') as f:
            json.dump(history, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"保存历史记录失败: {str(e)}")

@app.route('/')
def index():
    """渲染主页"""
    return render_template('index.html')

@app.route('/history', methods=['GET'])
def get_history_records():
    """获取历史用户名和视频路径记录"""
    history = get_history()
    return jsonify({"status": "success", "data": history})

@app.route('/config', methods=['POST'])
def save_config():
    """保存用户配置信息"""
    data = request.json
    user_id = data.get('userId')
    user_name = data.get('userName')
    video_folder = data.get('videoFolder')
    
    if not user_id or not user_name or not video_folder:
        return jsonify({"status": "error", "message": "所有字段都是必填的"}), 400
    
    # 检查视频文件夹是否存在
    if not os.path.exists(video_folder) or not os.path.isdir(video_folder):
        return jsonify({"status": "error", "message": "视频文件夹路径不存在"}), 400
    
    # 保存到session
    session['user_id'] = user_id
    session['user_name'] = user_name
    session['video_folder'] = video_folder
    
    # 保存到历史记录
    save_history(user_name=user_name, video_path=video_folder)
    
    return jsonify({"status": "success", "message": "配置保存成功"})

@app.route('/videos', methods=['GET'])
def list_videos():
    """列出视频文件夹中的所有视频"""
    if 'video_folder' not in session:
        return jsonify({"status": "error", "message": "未配置视频文件夹"}), 400
    
    video_folder = session.get('video_folder')
    
    try:
        videos = []
        for file in os.listdir(video_folder):
            file_path = os.path.join(video_folder, file)
            if os.path.isfile(file_path) and any(file.lower().endswith(ext) for ext in VIDEO_EXTENSIONS):
                # 检查是否存在对应的标注文件
                annotation_file_path = file_path + '.json'
                has_annotations = os.path.exists(annotation_file_path)
                
                # 获取当前用户ID
                current_user_id = session.get('user_id')
                
                # 初始化标注信息
                annotations_count = 0
                user_annotations_count = 0
                other_users_annotations_count = 0
                
                # 如果有标注文件，检查是否有实际标注内容
                if has_annotations:
                    try:
                        with open(annotation_file_path, 'r', encoding='utf-8') as f:
                            annotation_data = json.load(f)
                            
                            # 获取总标注数量
                            if 'annotations' in annotation_data:
                                annotations_count = len(annotation_data['annotations'])
                                
                                # 过滤出当前用户和其他用户的标注
                                for ann in annotation_data['annotations']:
                                    if ann.get('userId') == current_user_id:
                                        user_annotations_count += 1
                                    else:
                                        other_users_annotations_count += 1
                            
                            # 优先使用按用户分组的数据结构(向前兼容)
                            if 'annotationsByUser' in annotation_data:
                                # 当前用户的标注数量
                                if current_user_id in annotation_data['annotationsByUser']:
                                    user_annotations_count = len(annotation_data['annotationsByUser'][current_user_id])
                                
                                # 其他用户的标注数量
                                for user_id, user_annotations in annotation_data['annotationsByUser'].items():
                                    if user_id != current_user_id:
                                        other_users_annotations_count += len(user_annotations)
                    except Exception as e:
                        logger.error(f"读取标注文件失败: {str(e)}")
                        has_annotations = False
                
                videos.append({
                    "name": file,
                    "path": file,  # 相对路径，用于后续视频流API调用
                    "size": os.path.getsize(file_path),
                    "lastModified": datetime.fromtimestamp(os.path.getmtime(file_path)).isoformat(),
                    "hasAnnotations": has_annotations and annotations_count > 0,
                    "annotationsCount": annotations_count,
                    "userAnnotationsCount": user_annotations_count,
                    "otherUsersAnnotationsCount": other_users_annotations_count,
                    "hasUserAnnotations": user_annotations_count > 0,
                    "hasOtherUsersAnnotations": other_users_annotations_count > 0
                })
        
        return jsonify({"status": "success", "videos": videos})
    
    except Exception as e:
        logger.error(f"获取视频列表失败: {str(e)}")
        return jsonify({"status": "error", "message": f"获取视频列表失败: {str(e)}"}), 500

@app.route('/video_stream/<path:video_path>')
def video_stream(video_path):
    """流式传输视频文件"""
    if 'video_folder' not in session:
        logger.warning("视频流请求未配置视频文件夹")
        return jsonify({"status": "error", "message": "未配置视频文件夹"}), 400
    
    video_folder = session.get('video_folder')
    
    try:
        # 构建完整路径
        full_path = os.path.join(video_folder, video_path)
        
        # 检查路径合法性
        if not is_safe_path(video_folder, full_path):
            logger.warning(f"检测到非法视频路径访问: {video_path}")
            return jsonify({"status": "error", "message": "非法的视频路径"}), 403
        
        # 检查文件是否存在
        if not os.path.exists(full_path) or not os.path.isfile(full_path):
            logger.warning(f"请求的视频文件不存在: {full_path}")
            return jsonify({"status": "error", "message": "视频文件不存在"}), 404
        
        # 检查文件扩展名
        if not any(full_path.lower().endswith(ext) for ext in VIDEO_EXTENSIONS):
            logger.warning(f"请求的文件不是支持的视频格式: {full_path}")
            return jsonify({"status": "error", "message": "不支持的视频格式"}), 400
        
        logger.info(f"流式传输视频: {video_path}")
        
        # 使用send_from_directory函数处理
        return send_from_directory(
            video_folder, 
            video_path, 
            conditional=True  # 启用条件请求(HTTP Range),以支持视频拖动
        )
    except Exception as e:
        logger.error(f"视频流处理错误: {str(e)}")
        return jsonify({"status": "error", "message": f"视频流处理错误: {str(e)}"}), 500

@app.route('/annotations/<path:video_path>', methods=['GET', 'POST'])
def handle_annotations(video_path):
    """处理视频标注数据"""
    if 'video_folder' not in session:
        return jsonify({"status": "error", "message": "未配置视频文件夹"}), 400
    
    video_folder = session.get('video_folder')
    
    # 构建视频文件完整路径
    video_full_path = os.path.join(video_folder, video_path)
    
    # 检查视频路径合法性
    if not os.path.normpath(video_full_path).startswith(os.path.normpath(video_folder)):
        return jsonify({"status": "error", "message": "非法的视频路径"}), 403
    
    # 检查视频文件是否存在
    if not os.path.exists(video_full_path) or not os.path.isfile(video_full_path):
        return jsonify({"status": "error", "message": "视频文件不存在"}), 404
    
    # 构建标注JSON文件路径
    annotation_file_path = video_full_path + '.json'
    
    if request.method == 'GET':
        # 读取标注
        if os.path.exists(annotation_file_path):
            try:
                with open(annotation_file_path, 'r', encoding='utf-8') as f:
                    annotation_data = json.load(f)
                return jsonify({"status": "success", "data": annotation_data})
            except Exception as e:
                return jsonify({"status": "error", "message": f"读取标注文件失败: {str(e)}"}), 500
        else:
            # 如果标注文件不存在，返回简化的空标注结构
            empty_annotations = {
                "videoFilePath": video_full_path,
                "videoId": os.path.basename(video_full_path),
                "lastModified": datetime.now().isoformat(),
                "annotations": []  # 只保留annotations字段
            }
            return jsonify({"status": "success", "data": empty_annotations})
    
    elif request.method == 'POST':
        # 保存标注
        try:
            annotation_data = request.json
            user_id = session.get('user_id')
            user_name = session.get('user_name', "未知用户")
            
            # 验证数据结构
            if not isinstance(annotation_data, dict):
                return jsonify({"status": "error", "message": "标注数据格式无效"}), 400
            
            # 读取现有标注文件（如果存在）
            existing_data = {}
            if os.path.exists(annotation_file_path):
                try:
                    with open(annotation_file_path, 'r', encoding='utf-8') as f:
                        existing_data = json.load(f)
                except:
                    # 如果读取失败，创建新的数据结构
                    existing_data = {
                        "videoFilePath": video_full_path,
                        "videoId": os.path.basename(video_full_path),
                        "lastModified": datetime.now().isoformat(),
                        "annotations": []
                    }
            else:
                # 文件不存在，创建新的数据结构
                existing_data = {
                    "videoFilePath": video_full_path,
                    "videoId": os.path.basename(video_full_path),
                    "lastModified": datetime.now().isoformat(),
                    "annotations": []
                }
            
            # 获取用户提交的标注数据
            user_annotations = []
            if "annotations" in annotation_data:
                user_annotations = annotation_data["annotations"]
                
                # 确保每个标注都有用户ID和用户名
                for annotation in user_annotations:
                    if "userId" not in annotation:
                        annotation["userId"] = user_id
                    if "userName" not in annotation:
                        annotation["userName"] = user_name
            
            # 处理标注合并
            # 先移除当前用户的旧标注
            if "annotations" in existing_data:
                existing_data["annotations"] = [
                    ann for ann in existing_data["annotations"] 
                    if ann.get("userId") != user_id
                ]
            
            # 添加当前用户的新标注
            existing_data["annotations"].extend(user_annotations)
            
            # 更新时间戳
            existing_data["lastModified"] = datetime.now().isoformat()
            
            # 确保目录存在
            os.makedirs(os.path.dirname(annotation_file_path), exist_ok=True)
            
            # 首先写入临时文件，然后重命名，确保原子性
            temp_file_path = annotation_file_path + '.temp'
            with open(temp_file_path, 'w', encoding='utf-8') as f:
                json.dump(existing_data, f, ensure_ascii=False, indent=2)
            
            # 在Windows上，可能需要先删除目标文件，因为它可能不支持直接覆盖
            if os.path.exists(annotation_file_path):
                os.remove(annotation_file_path)
            
            os.rename(temp_file_path, annotation_file_path)
            
            return jsonify({"status": "success", "message": "标注数据保存成功", "data": existing_data})
        
        except Exception as e:
            logger.error(f"保存标注数据失败: {str(e)}", exc_info=True)
            return jsonify({"status": "error", "message": f"保存标注数据失败: {str(e)}"}), 500

@app.route('/video_metadata/<path:video_path>', methods=['GET'])
def get_video_metadata(video_path):
    """获取视频元数据（如帧率）"""
    if 'video_folder' not in session:
        return jsonify({"status": "error", "message": "未配置视频文件夹"}), 400
    
    try:
        video_folder = session.get('video_folder')
        
        # 构建视频文件完整路径
        video_full_path = os.path.join(video_folder, video_path)
        
        # 检查路径合法性
        if not is_safe_path(video_folder, video_full_path):
            logger.warning(f"检测到非法视频路径访问: {video_path}")
            return jsonify({"status": "error", "message": "非法的视频路径"}), 403
        
        # 检查文件是否存在
        if not os.path.exists(video_full_path) or not os.path.isfile(video_full_path):
            logger.warning(f"请求的视频文件不存在: {video_full_path}")
            return jsonify({"status": "error", "message": "视频文件不存在"}), 404
        
        # 使用OpenCV获取视频元数据
        cap = cv2.VideoCapture(video_full_path)
        if not cap.isOpened():
            return jsonify({"status": "error", "message": "无法打开视频文件"}), 500
        
        # 获取帧率
        frame_rate = cap.get(cv2.CAP_PROP_FPS)
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / frame_rate if frame_rate > 0 else 0
        
        # 释放视频
        cap.release()
        
        return jsonify({
            "status": "success",
            "frameRate": frame_rate,
            "width": width,
            "height": height,
            "totalFrames": total_frames,
            "duration": duration
        })
        
    except Exception as e:
        logger.error(f"获取视频元数据错误: {str(e)}")
        return jsonify({"status": "error", "message": f"获取视频元数据错误: {str(e)}"}), 500

@app.route('/export_visual', methods=['POST'])
def export_visual():
    """导出标注可视化结果"""
    if 'video_folder' not in session:
        return jsonify({"status": "error", "message": "未配置视频文件夹"}), 400
    
    try:
        data = request.json
        video_path = data.get('videoPath')
        output_dir = data.get('outputDir')
        
        if not video_path or not output_dir:
            return jsonify({"status": "error", "message": "视频路径和输出目录都是必需的"}), 400
        
        video_folder = session.get('video_folder')
        
        # 构建视频文件完整路径
        video_full_path = os.path.join(video_folder, video_path)
        
        # 检查视频路径合法性
        if not os.path.normpath(video_full_path).startswith(os.path.normpath(video_folder)):
            return jsonify({"status": "error", "message": "非法的视频路径"}), 403
        
        # 检查视频文件是否存在
        if not os.path.exists(video_full_path) or not os.path.isfile(video_full_path):
            return jsonify({"status": "error", "message": "视频文件不存在"}), 404
        
        # 检查输出目录并创建
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        # 创建视频特定的输出子目录
        video_name = os.path.basename(video_path)
        video_output_dir = os.path.join(output_dir, os.path.splitext(video_name)[0])
        os.makedirs(video_output_dir, exist_ok=True)
        
        # 获取标注数据
        annotation_file_path = video_full_path + '.json'
        if not os.path.exists(annotation_file_path):
            return jsonify({"status": "error", "message": "标注文件不存在"}), 404
        
        with open(annotation_file_path, 'r', encoding='utf-8') as f:
            annotation_data = json.load(f)
        
        if not annotation_data.get('annotations'):
            return jsonify({"status": "warning", "message": "没有找到标注数据"}), 200
        
        # 处理视频，提取片段和帧
        processed = {
            "intervals": [],
            "frames": []
        }
        
        try:
            video = VideoFileClip(video_full_path)
            
            for i, annotation in enumerate(annotation_data.get('annotations', [])):
                try:
                    annotation_id = annotation.get('annotationId', f"annotation_{i}")
                    label = annotation.get('label', 'unknown')
                    
                    # 清理标签用于文件名
                    safe_label = re.sub(r'[\\/*?:"<>|]', '_', label)
                    
                    if annotation.get('type') == 'interval':
                        start_time = parse_time_to_seconds(annotation.get('startTime'))
                        end_time = parse_time_to_seconds(annotation.get('endTime'))
                        
                        if start_time is None or end_time is None:
                            continue
                        
                        # 获取帧序号（如果存在）
                        start_frame = annotation.get('startFrame', None)
                        end_frame = annotation.get('endFrame', None)
                        
                        if start_frame is not None and end_frame is not None:
                            # 包含帧序号的文件名
                            output_filename = f"{os.path.splitext(video_name)[0]}_{i}_{safe_label}_frames{start_frame}-{end_frame}_{annotation.get('startTime').replace(':', '-')}_{annotation.get('endTime').replace(':', '-')}.mp4"
                        else:
                            output_filename = f"{os.path.splitext(video_name)[0]}_{i}_{safe_label}_{annotation.get('startTime').replace(':', '-')}_{annotation.get('endTime').replace(':', '-')}.mp4"
                            
                        output_path = os.path.join(video_output_dir, output_filename)
                        
                        # 提取视频片段
                        clip = video.subclip(start_time, end_time)
                        clip.write_videofile(output_path, codec="libx264", audio_codec="aac")
                        
                        processed["intervals"].append({
                            "annotation": annotation,
                            "output_path": output_path
                        })
                    
                    elif annotation.get('type') == 'frame':
                        time_stamp = parse_time_to_seconds(annotation.get('timestamp'))
                        
                        if time_stamp is None:
                            continue
                        
                        # 获取帧序号（如果存在）
                        frame_number = annotation.get('frameNumber', None)
                        
                        if frame_number is not None:
                            # 包含帧序号的文件名
                            output_filename = f"{os.path.splitext(video_name)[0]}_{i}_{safe_label}_frame{frame_number}_{annotation.get('timestamp').replace(':', '-')}.jpg"
                        else:
                            output_filename = f"{os.path.splitext(video_name)[0]}_{i}_{safe_label}_{annotation.get('timestamp').replace(':', '-')}.jpg"
                            
                        output_path = os.path.join(video_output_dir, output_filename)
                        
                        # 提取帧
                        video.save_frame(output_path, time_stamp)
                        
                        processed["frames"].append({
                            "annotation": annotation,
                            "output_path": output_path
                        })
                except Exception as e:
                    print(f"处理标注 {i} 时出错: {str(e)}")
            
            video.close()
            
        except Exception as e:
            return jsonify({"status": "error", "message": f"视频处理失败: {str(e)}"}), 500
        
        return jsonify({
            "status": "success", 
            "message": "导出完成",
            "output_dir": video_output_dir,
            "processed": processed
        })
        
    except Exception as e:
        return jsonify({"status": "error", "message": f"导出过程失败: {str(e)}"}), 500

@app.route('/open_folder', methods=['POST'])
def open_folder():
    """打开本地文件夹"""
    data = request.json
    folder_path = data.get('path')
    
    if not folder_path:
        return jsonify({"status": "error", "message": "未提供文件夹路径"}), 400
    
    try:
        # 检查路径是否存在
        if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
            return jsonify({"status": "error", "message": "文件夹路径不存在或不是目录"}), 400
        
        # 根据操作系统打开文件夹
        if os.name == 'nt':  # Windows
            os.startfile(folder_path)
        elif os.name == 'posix':  # macOS 和 Linux
            import subprocess
            if os.path.exists('/usr/bin/open'):  # macOS
                subprocess.Popen(['open', folder_path])
            else:  # Linux
                subprocess.Popen(['xdg-open', folder_path])
        else:
            return jsonify({"status": "error", "message": "不支持的操作系统"}), 500
        
        logger.info(f"打开本地文件夹: {folder_path}")
        return jsonify({"status": "success", "message": "文件夹已打开"})
    except Exception as e:
        logger.error(f"打开文件夹失败: {str(e)}")
        return jsonify({"status": "error", "message": f"打开文件夹失败: {str(e)}"}), 500

def parse_time_to_seconds(time_str):
    """将HH:MM:SS.mmm格式的时间转换为秒"""
    if not time_str:
        return None
    
    try:
        time_pattern = r'^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$'
        match = re.match(time_pattern, time_str)
        
        if not match:
            return None
        
        hours = int(match.group(1))
        minutes = int(match.group(2))
        seconds = int(match.group(3))
        milliseconds = int(match.group(4))
        
        return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000
    except:
        return None

if __name__ == '__main__':
    app.run(debug=True)