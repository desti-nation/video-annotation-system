/**
 * 工作状态视频数据标注系统 - 前端JS
 */

// DOM元素引用
const configSection = document.getElementById('configSection');
const mainAppSection = document.getElementById('mainAppSection');
const configForm = document.getElementById('configForm');
const userNameInput = document.getElementById('userName');
const videoFolderInput = document.getElementById('videoFolder');
const userNameList = document.getElementById('userNameList');
const videoFolderList = document.getElementById('videoFolderList');
const userNameDropdown = document.getElementById('userNameDropdown');
const videoFolderDropdown = document.getElementById('videoFolderDropdown');
const userInfoDisplay = document.getElementById('userInfoDisplay');
const videoFolderDisplay = document.getElementById('videoFolderDisplay');
const changeConfigBtn = document.getElementById('changeConfigBtn');
const openFolderBtn = document.getElementById('openFolderBtn');
const videoListContainer = document.getElementById('videoListContainer');
const videoPlayer = document.getElementById('videoPlayer');
const currentVideoTitle = document.getElementById('currentVideoTitle');
const prevFrameBtn = document.getElementById('prevFrameBtn');
const nextFrameBtn = document.getElementById('nextFrameBtn');
const playbackRateSelect = document.getElementById('playbackRate');
const currentTimeDisplay = document.getElementById('currentTimeDisplay');
const durationDisplay = document.getElementById('durationDisplay');
const intervalTypeRadio = document.getElementById('intervalType');
const frameTypeRadio = document.getElementById('frameType');
const intervalAnnotationSection = document.getElementById('intervalAnnotationSection');
const frameAnnotationSection = document.getElementById('frameAnnotationSection');
const startTimeInput = document.getElementById('startTime');
const endTimeInput = document.getElementById('endTime');
const setStartTimeBtn = document.getElementById('setStartTimeBtn');
const setEndTimeBtn = document.getElementById('setEndTimeBtn');
const frameTimeInput = document.getElementById('frameTime');
const setFrameTimeBtn = document.getElementById('setFrameTimeBtn');
const annotationLabelInput = document.getElementById('annotationLabel');
const saveAnnotationBtn = document.getElementById('saveAnnotationBtn');
const exportVisualsBtn = document.getElementById('exportVisualsBtn');
const openExportDirBtn = document.getElementById('openExportDirBtn');
const annotationListContainer = document.getElementById('annotationListContainer');

// DOM元素引用 - 模态框相关
const messageModalElement = document.getElementById('messageModal');
const messageModalTitleElement = document.getElementById('messageModalTitle');
const messageModalBodyElement = document.getElementById('messageModalBody');

// 全局变量
let messageModal;
let currentVideoPath = null;
let currentAnnotations = []; // 当前用户的标注
let otherUsersAnnotations = []; // 其他用户的标注
let allAnnotationsData = {}; // 完整的标注数据
let isConfigured = false;
let videoFrameRate = 30; // 默认帧率，实际应从视频元数据获取
let isShowingAllAnnotations = false; // 是否显示所有用户的标注

// 中文汉字基本拼音对照表（常用字）
const pinyinDict = {
    '阿': 'a',
    '啊': 'a',
    '哎': 'ai',
    '唉': 'ai',
    '爱': 'ai',
    '安': 'an',
    '暗': 'an',
    '按': 'an',
    '昂': 'ang',
    '袄': 'ao',
    '傲': 'ao',
    '奥': 'ao',
    '八': 'ba',
    '巴': 'ba',
    '白': 'bai',
    '百': 'bai',
    '班': 'ban',
    '般': 'ban',
    '办': 'ban',
    '半': 'ban',
    '帮': 'bang',
    '包': 'bao',
    '报': 'bao',
    '抱': 'bao',
    '北': 'bei',
    '背': 'bei',
    '被': 'bei',
    '本': 'ben',
    '比': 'bi',
    '彼': 'bi',
    '笔': 'bi',
    '秘': 'bi',
    '必': 'bi',
    '边': 'bian',
    '变': 'bian',
    '表': 'biao',
    '别': 'bie',
    '并': 'bing',
    '波': 'bo',
    '博': 'bo',
    '不': 'bu',
    '步': 'bu',
    '部': 'bu',
    '才': 'cai',
    '采': 'cai',
    '彩': 'cai',
    '参': 'can',
    '藏': 'cang',
    '草': 'cao',
    '层': 'ceng',
    '茶': 'cha',
    '察': 'cha',
    '查': 'cha',
    '产': 'chan',
    '长': 'chang',
    '常': 'chang',
    '场': 'chang',
    '唱': 'chang',
    '超': 'chao',
    '朝': 'chao',
    '潮': 'chao',
    '车': 'che',
    '陈': 'chen',
    '称': 'chen',
    '成': 'cheng',
    '程': 'cheng',
    '城': 'cheng',
    '吃': 'chi',
    '出': 'chu',
    '初': 'chu',
    '除': 'chu',
    '处': 'chu',
    '川': 'chuan',
    '传': 'chuan',
    '船': 'chuan',
    '窗': 'chuang',
    '床': 'chuang',
    '创': 'chuang',
    '春': 'chun',
    '次': 'ci',
    '此': 'ci',
    '从': 'cong',
    '存': 'cun',
    '村': 'cun',
    '错': 'cuo',
    '答': 'da',
    '打': 'da',
    '大': 'da',
    '代': 'dai',
    '带': 'dai',
    '待': 'dai',
    '单': 'dan',
    '但': 'dan',
    '当': 'dang',
    '倒': 'dao',
    '到': 'dao',
    '道': 'dao',
    '得': 'de',
    '的': 'de',
    '等': 'deng',
    '底': 'di',
    '地': 'di',
    '第': 'di',
    '点': 'dian',
    '典': 'dian',
    '电': 'dian',
    '顶': 'ding',
    '定': 'ding',
    '东': 'dong',
    '冬': 'dong',
    '动': 'dong',
    '都': 'dou',
    '斗': 'dou',
    '读': 'du',
    '度': 'du',
    '短': 'duan',
    '段': 'duan',
    '断': 'duan',
    '队': 'dui',
    '对': 'dui',
    '多': 'duo',
    '饿': 'e',
    '恩': 'en',
    '而': 'er',
    '儿': 'er',
    '耳': 'er',
    '二': 'er',
    '发': 'fa',
    '法': 'fa',
    '番': 'fan',
    '反': 'fan',
    '饭': 'fan',
    '方': 'fang',
    '房': 'fang',
    '防': 'fang',
    '飞': 'fei',
    '分': 'fen',
    '风': 'feng',
    '佛': 'fo',
    '否': 'fou',
    '夫': 'fu',
    '服': 'fu',
    '福': 'fu',
    '父': 'fu',
    '复': 'fu',
    '富': 'fu',
    '该': 'gai',
    '改': 'gai',
    '盖': 'gai',
    '干': 'gan',
    '刚': 'gang',
    '高': 'gao',
    '告': 'gao',
    '哥': 'ge',
    '格': 'ge',
    '个': 'ge',
    '给': 'gei',
    '跟': 'gen',
    '更': 'geng',
    '工': 'gong',
    '公': 'gong',
    '功': 'gong',
    '共': 'gong',
    '狗': 'gou',
    '够': 'gou',
    '古': 'gu',
    '固': 'gu',
    '故': 'gu',
    '官': 'guan',
    '关': 'guan',
    '观': 'guan',
    '惯': 'guan',
    '光': 'guang',
    '广': 'guang',
    '规': 'gui',
    '鬼': 'gui',
    '贵': 'gui',
    '国': 'guo',
    '果': 'guo',
    '过': 'guo',
    '还': 'hai',
    '海': 'hai',
    '害': 'hai',
    '含': 'han',
    '汉': 'han',
    '好': 'hao',
    '号': 'hao',
    '喝': 'he',
    '和': 'he',
    '河': 'he',
    '黑': 'hei',
    '很': 'hen',
    '红': 'hong',
    '后': 'hou',
    '候': 'hou',
    '湖': 'hu',
    '护': 'hu',
    '花': 'hua',
    '化': 'hua',
    '画': 'hua',
    '话': 'hua',
    '怀': 'huai',
    '坏': 'huai',
    '欢': 'huan',
    '还': 'huan',
    '换': 'huan',
    '黄': 'huang',
    '回': 'hui',
    '会': 'hui',
    '婚': 'hun',
    '混': 'hun',
    '或': 'huo',
    '活': 'huo',
    '机': 'ji',
    '鸡': 'ji',
    '积': 'ji',
    '极': 'ji',
    '急': 'ji',
    '几': 'ji',
    '己': 'ji',
    '记': 'ji',
    '季': 'ji',
    '家': 'jia',
    '加': 'jia',
    '假': 'jia',
    '间': 'jian',
    '简': 'jian',
    '见': 'jian',
    '建': 'jian',
    '健': 'jian',
    '江': 'jiang',
    '将': 'jiang',
    '讲': 'jiang',
    '交': 'jiao',
    '教': 'jiao',
    '接': 'jie',
    '结': 'jie',
    '解': 'jie',
    '姐': 'jie',
    '界': 'jie',
    '金': 'jin',
    '今': 'jin',
    '进': 'jin',
    '近': 'jin',
    '经': 'jing',
    '京': 'jing',
    '精': 'jing',
    '井': 'jing',
    '景': 'jing',
    '静': 'jing',
    '九': 'jiu',
    '酒': 'jiu',
    '久': 'jiu',
    '就': 'jiu',
    '旧': 'jiu',
    '救': 'jiu',
    '居': 'ju',
    '局': 'ju',
    '菊': 'ju',
    '举': 'ju',
    '句': 'ju',
    '具': 'ju',
    '决': 'jue',
    '绝': 'jue',
    '觉': 'jue',
    '军': 'jun',
    '开': 'kai',
    '看': 'kan',
    '考': 'kao',
    '靠': 'kao',
    '科': 'ke',
    '可': 'ke',
    '克': 'ke',
    '口': 'kou',
    '快': 'kuai',
    '块': 'kuai',
    '宽': 'kuan',
    '况': 'kuang',
    '亏': 'kui',
    '困': 'kun',
    '扩': 'kuo',
    '拉': 'la',
    '来': 'lai',
    '兰': 'lan',
    '蓝': 'lan',
    '老': 'lao',
    '乐': 'le',
    '类': 'lei',
    '冷': 'leng',
    '离': 'li',
    '李': 'li',
    '里': 'li',
    '立': 'li',
    '力': 'li',
    '历': 'li',
    '利': 'li',
    '丽': 'li',
    '连': 'lian',
    '联': 'lian',
    '凉': 'liang',
    '两': 'liang',
    '亮': 'liang',
    '谅': 'liang',
    '量': 'liang',
    '列': 'lie',
    '林': 'lin',
    '临': 'lin',
    '灵': 'ling',
    '领': 'ling',
    '另': 'ling',
    '留': 'liu',
    '六': 'liu',
    '龙': 'long',
    '楼': 'lou',
    '路': 'lu',
    '录': 'lu',
    '卢': 'lu',
    '炉': 'lu',
    '鲁': 'lu',
    '陆': 'lu',
    '绿': 'lv',
    '乱': 'luan',
    '论': 'lun',
    '罗': 'luo',
    '落': 'luo',
    '妈': 'ma',
    '马': 'ma',
    '码': 'ma',
    '买': 'mai',
    '卖': 'mai',
    '满': 'man',
    '毛': 'mao',
    '没': 'mei',
    '每': 'mei',
    '美': 'mei',
    '门': 'men',
    '们': 'men',
    '梦': 'meng',
    '米': 'mi',
    '面': 'mian',
    '秒': 'miao',
    '民': 'min',
    '明': 'ming',
    '名': 'ming',
    '命': 'ming',
    '摸': 'mo',
    '末': 'mo',
    '某': 'mou',
    '木': 'mu',
    '目': 'mu',
    '那': 'na',
    '南': 'nan',
    '难': 'nan',
    '脑': 'nao',
    '能': 'neng',
    '你': 'ni',
    '年': 'nian',
    '念': 'nian',
    '鸟': 'niao',
    '您': 'nin',
    '牛': 'niu',
    '农': 'nong',
    '女': 'nv',
    '区': 'ou',
    '偶': 'ou',
    '怕': 'pa',
    '排': 'pai',
    '判': 'pan',
    '旁': 'pang',
    '跑': 'pao',
    '配': 'pei',
    '朋': 'peng',
    '皮': 'pi',
    '片': 'pian',
    '漂': 'piao',
    '票': 'piao',
    '平': 'ping',
    '评': 'ping',
    '破': 'po',
    '普': 'pu',
    '七': 'qi',
    '其': 'qi',
    '起': 'qi',
    '气': 'qi',
    '却': 'que',
    '去': 'qu',
    '全': 'quan',
    '确': 'que',
    '然': 'ran',
    '让': 'rang',
    '热': 're',
    '人': 'ren',
    '认': 'ren',
    '日': 'ri',
    '容': 'rong',
    '如': 'ru',
    '入': 'ru',
    '软': 'ruan',
    '弱': 'ruo',
    '三': 'san',
    '色': 'se',
    '森': 'sen',
    '沙': 'sha',
    '山': 'shan',
    '上': 'shang',
    '少': 'shao',
    '社': 'she',
    '申': 'shen',
    '深': 'shen',
    '什': 'shen',
    '生': 'sheng',
    '事': 'shi',
    '时': 'shi',
    '使': 'shi',
    '示': 'shi',
    '世': 'shi',
    '市': 'shi',
    '是': 'shi',
    '收': 'shou',
    '受': 'shou',
    '熟': 'shu',
    '数': 'shu',
    '谁': 'shui',
    '水': 'shui',
    '思': 'si',
    '死': 'si',
    '四': 'si',
    '颂': 'song',
    '虽': 'sui',
    '岁': 'sui',
    '孙': 'sun',
    '所': 'suo',
    '他': 'ta',
    '她': 'ta',
    '它': 'ta',
    '太': 'tai',
    '态': 'tai',
    '谈': 'tan',
    '唐': 'tang',
    '堂': 'tang',
    '套': 'tao',
    '特': 'te',
    '提': 'ti',
    '题': 'ti',
    '体': 'ti',
    '天': 'tian',
    '听': 'ting',
    '通': 'tong',
    '同': 'tong',
    '头': 'tou',
    '图': 'tu',
    '徒': 'tu',
    '土': 'tu',
    '团': 'tuan',
    '推': 'tui',
    '外': 'wai',
    '弯': 'wan',
    '完': 'wan',
    '王': 'wang',
    '往': 'wang',
    '望': 'wang',
    '为': 'wei',
    '位': 'wei',
    '未': 'wei',
    '文': 'wen',
    '我': 'wo',
    '握': 'wo',
    '无': 'wu',
    '物': 'wu',
    '五': 'wu',
    '午': 'wu',
    '武': 'wu',
    '西': 'xi',
    '习': 'xi',
    '息': 'xi',
    '吸': 'xi',
    '喜': 'xi',
    '系': 'xi',
    '下': 'xia',
    '夏': 'xia',
    '先': 'xian',
    '现': 'xian',
    '香': 'xiang',
    '想': 'xiang',
    '向': 'xiang',
    '像': 'xiang',
    '小': 'xiao',
    '效': 'xiao',
    '笑': 'xiao',
    '校': 'xiao',
    '些': 'xie',
    '写': 'xie',
    '谢': 'xie',
    '心': 'xin',
    '新': 'xin',
    '信': 'xin',
    '行': 'xing',
    '形': 'xing',
    '醒': 'xing',
    '姓': 'xing',
    '兴': 'xing',
    '休': 'xiu',
    '修': 'xiu',
    '许': 'xu',
    '续': 'xu',
    '需': 'xu',
    '选': 'xuan',
    '学': 'xue',
    '雪': 'xue',
    '寻': 'xun',
    '压': 'ya',
    '呀': 'ya',
    '言': 'yan',
    '颜': 'yan',
    '眼': 'yan',
    '演': 'yan',
    '验': 'yan',
    '央': 'yang',
    '洋': 'yang',
    '样': 'yang',
    '要': 'yao',
    '也': 'ye',
    '业': 'ye',
    '页': 'ye',
    '夜': 'ye',
    '一': 'yi',
    '因': 'yin',
    '音': 'yin',
    '影': 'ying',
    '应': 'ying',
    '英': 'ying',
    '用': 'yong',
    '优': 'you',
    '友': 'you',
    '右': 'you',
    '有': 'you',
    '语': 'yu',
    '与': 'yu',
    '于': 'yu',
    '育': 'yu',
    '雨': 'yu',
    '预': 'yu',
    '原': 'yuan',
    '员': 'yuan',
    '怨': 'yuan',
    '院': 'yuan',
    '约': 'yue',
    '越': 'yue',
    '月': 'yue',
    '云': 'yun',
    '杂': 'za',
    '载': 'zai',
    '在': 'zai',
    '再': 'zai',
    '咱': 'zan',
    '早': 'zao',
    '造': 'zao',
    '增': 'zeng',
    '占': 'zhan',
    '战': 'zhan',
    '长': 'zhang',
    '张': 'zhang',
    '找': 'zhao',
    '照': 'zhao',
    '着': 'zhe',
    '真': 'zhen',
    '正': 'zheng',
    '整': 'zheng',
    '政': 'zheng',
    '之': 'zhi',
    '知': 'zhi',
    '只': 'zhi',
    '至': 'zhi',
    '制': 'zhi',
    '中': 'zhong',
    '忠': 'zhong',
    '种': 'zhong',
    '州': 'zhou',
    '主': 'zhu',
    '注': 'zhu',
    '走': 'zou',
    '足': 'zu',
    '组': 'zu',
    '嘴': 'zui',
    '最': 'zui',
    '作': 'zuo'
};

// 函数: 显示消息
function showMessage(title, message) {
    messageModalTitleElement.textContent = title;
    messageModalBodyElement.textContent = message;
    messageModal.show();
}

// 函数: 格式化时间
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}

// 函数: 计算帧序号
function calculateFrameNumber(seconds) {
    // 根据当前时间和帧率计算帧序号（从0开始）
    return Math.floor(seconds * videoFrameRate);
}

// 函数: 解析时间
function parseTime(timeStr) {
    // 匹配HH:MM:SS.mmm格式
    const regex = /^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/;
    const match = timeStr.match(regex);

    if (!match) return null;

    const hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const seconds = parseInt(match[3]);
    const milliseconds = parseInt(match[4]);

    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
}

// 函数: 将中文名字转换为拼音
function convertNameToPinyin(name) {
    try {
        // 尝试使用不同的拼音库API
        if (typeof pinyinPro !== 'undefined' && pinyinPro.pinyin) {
            // pinyin-pro库
            return pinyinPro.pinyin(name, {
                toneType: 'none',
                caseType: 'lower',
                type: 'string',
                nonZh: 'retain' // 修改为保留非中文字符
            }).replace(/\s+/g, ''); // 移除空格
        } else if (typeof pinyin !== 'undefined') {
            // 其他pinyin库
            let result = '';
            // 逐字符处理，保留非中文字符
            for (let i = 0; i < name.length; i++) {
                const char = name.charAt(i);
                if (/[\u4e00-\u9fa5]/.test(char)) {
                    // 中文字符
                    result += pinyin(char, { style: pinyin.STYLE_NORMAL }).join('');
                } else {
                    // 非中文字符(数字、字母等)直接保留
                    result += char;
                }
            }
            return result.toLowerCase();
        } else {
            // 如果库加载失败，使用本地转换方案
            return convertUsingLocalDict(name);
        }
    } catch (error) {
        console.error('拼音转换失败', error);
        return convertUsingLocalDict(name);
    }
}

// 使用本地字典转换拼音
function convertUsingLocalDict(name) {
    let result = '';
    // 遍历每个字符
    for (let i = 0; i < name.length; i++) {
        const char = name.charAt(i);
        if (pinyinDict[char]) {
            // 中文字符查字典转拼音
            result += pinyinDict[char];
        } else if (/[a-zA-Z0-9]/.test(char)) {
            // 保留英文字母和数字
            result += char.toLowerCase();
        } else if (/\s/.test(char)) {
            // 空格跳过，保持ID紧凑
            continue;
        } else {
            // 其他字符（标点等）跳过
            continue;
        }
    }

    // 确保生成的ID不为空且不含特殊字符
    if (!result || result.length < 2) {
        return simplifyName(name);
    }

    return result;
}

// 简单的名字处理 (备用方案)
function simplifyName(name) {
    // 移除所有非字母数字的字符，确保ID不含特殊字符
    const simplified = name.replace(/[^\w\d]/g, '');
    if (simplified) {
        return simplified.toLowerCase() + Math.floor(Math.random() * 100);
    }

    // 最后的备用方案：使用随机ID
    const randomId = 'user' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    console.log(`无法处理的用户名 "${name}"，使用随机ID: ${randomId}`);
    return randomId;
}

// 函数: 加载历史记录
async function loadHistoryRecords() {
    try {
        const response = await fetch('/history');
        const data = await response.json();

        if (response.ok && data.status === "success") {
            // 填充用户名历史记录 (datalist方式)
            userNameList.innerHTML = '';

            // 填充用户名下拉菜单 (Bootstrap dropdown方式)
            userNameDropdown.innerHTML = '';

            if (data.data.userNames && data.data.userNames.length > 0) {
                // 为datalist添加选项
                data.data.userNames.forEach(name => {
                    const option = document.createElement('option');
                    option.value = name;
                    userNameList.appendChild(option);
                });

                // 为下拉菜单添加选项
                data.data.userNames.forEach(name => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.className = 'dropdown-item';
                    a.href = '#';
                    a.textContent = name;
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        userNameInput.value = name;
                    });
                    li.appendChild(a);
                    userNameDropdown.appendChild(li);
                });
            }

            // 填充视频路径历史记录 (datalist方式)
            videoFolderList.innerHTML = '';

            // 填充视频路径下拉菜单 (Bootstrap dropdown方式)
            videoFolderDropdown.innerHTML = '';

            if (data.data.videoPaths && data.data.videoPaths.length > 0) {
                // 为datalist添加选项
                data.data.videoPaths.forEach(path => {
                    const option = document.createElement('option');
                    option.value = path;
                    videoFolderList.appendChild(option);
                });

                // 为下拉菜单添加选项
                data.data.videoPaths.forEach(path => {
                    const li = document.createElement('li');
                    const a = document.createElement('a');
                    a.className = 'dropdown-item';
                    a.href = '#';
                    a.textContent = path;
                    a.title = path; // 添加tooltip，方便查看长路径
                    a.addEventListener('click', (e) => {
                        e.preventDefault();
                        videoFolderInput.value = path;
                    });
                    li.appendChild(a);
                    videoFolderDropdown.appendChild(li);
                });
            }
        }
    } catch (error) {
        console.error("加载历史记录失败:", error);
    }
}

// 保存用户配置
configForm.addEventListener('submit', async(e) => {
    e.preventDefault();

    const userName = userNameInput.value.trim();
    const videoFolder = videoFolderInput.value.trim();

    if (!userName || !videoFolder) {
        showMessage('错误', '所有字段都是必填的');
        return;
    }

    // 从名字生成拼音ID
    const userId = convertNameToPinyin(userName);

    // 输出到控制台验证ID生成是否正确
    console.log(`用户名: "${userName}" -> 生成ID: "${userId}"`);

    try {
        const response = await fetch('/config', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: userId,
                userName: userName,
                videoFolder: videoFolder
            })
        });

        const data = await response.json();

        if (response.ok) {
            // 保存到localStorage
            localStorage.setItem('userId', userId);
            localStorage.setItem('userName', userName);
            localStorage.setItem('videoFolder', videoFolder);

            // 显示主应用界面
            configSection.classList.add('d-none');
            mainAppSection.classList.remove('d-none');

            // 更新显示
            userInfoDisplay.textContent = `用户: ${userName} (${userId})`;
            videoFolderDisplay.textContent = `视频路径: ${videoFolder}`;

            // 加载视频列表
            isConfigured = true;
            loadVideoList();
        } else {
            showMessage('错误', data.message || '配置保存失败');
        }
    } catch (error) {
        showMessage('错误', `请求失败: ${error.message}`);
    }
});

// 加载之前的配置
window.addEventListener('DOMContentLoaded', () => {
    const savedUserId = localStorage.getItem('userId');
    const savedUserName = localStorage.getItem('userName');
    const savedVideoFolder = localStorage.getItem('videoFolder');

    if (savedUserName && savedVideoFolder) {
        userNameInput.value = savedUserName;
        videoFolderInput.value = savedVideoFolder;
    }

    // 加载历史记录
    loadHistoryRecords();
});

// 更改配置按钮
changeConfigBtn.addEventListener('click', () => {
    mainAppSection.classList.add('d-none');
    configSection.classList.remove('d-none');
});

// 加载视频列表
async function loadVideoList() {
    if (!isConfigured) return;

    try {
        const response = await fetch('/videos');
        const data = await response.json();

        if (response.ok) {
            videoListContainer.innerHTML = '';

            if (data.videos.length === 0) {
                videoListContainer.innerHTML = '<div class="alert alert-info">没有找到视频文件</div>';
                return;
            }

            data.videos.forEach(video => {
                const videoItem = document.createElement('a');
                videoItem.className = 'list-group-item list-group-item-action video-item';

                // 根据标注情况设置样式类
                if (video.hasUserAnnotations && video.hasOtherUsersAnnotations) {
                    // 既有自己的标注又有他人的标注
                    videoItem.classList.add('mixed-annotated');
                } else if (video.hasUserAnnotations) {
                    // 只有自己的标注
                    videoItem.classList.add('user-annotated');
                } else if (video.hasOtherUsersAnnotations) {
                    // 只有他人的标注
                    videoItem.classList.add('others-annotated');
                }

                // 创建视频项内容
                let badgeHTML = '';
                let annotatorsHTML = '';

                // 添加标注数量徽章
                if (video.hasAnnotations) {
                    let badgeInfo = [];

                    // 收集标注信息
                    if (video.userAnnotationsCount > 0) {
                        badgeInfo.push(`我:${video.userAnnotationsCount}`);
                    }

                    if (video.otherUsersAnnotationsCount > 0) {
                        badgeInfo.push(`他人:${video.otherUsersAnnotationsCount}`);
                    }

                    // 构建标注信息HTML
                    if (badgeInfo.length > 0) {
                        badgeHTML = `<div class="annotation-summary">${badgeInfo.join(' ')}</div>`;
                    }

                    // 不再需要标注者小徽章信息
                    annotatorsHTML = '';
                }

                // 设置视频项内容 - 修改为文件名和下一行显示标注信息
                videoItem.innerHTML = `
                    <div class="d-flex flex-column">
                        <div class="file-name-container">${video.name}</div>
                        ${badgeHTML || ''}
                    </div>
                `;

                videoItem.dataset.path = video.path;

                videoItem.addEventListener('click', () => {
                    document.querySelectorAll('.video-item').forEach(item => {
                        item.classList.remove('active');
                    });
                    videoItem.classList.add('active');
                    loadVideo(video.path);
                });

                videoListContainer.appendChild(videoItem);
            });
        } else {
            showMessage('错误', data.message || '无法加载视频列表');
        }
    } catch (error) {
        showMessage('错误', `请求失败: ${error.message}`);
    }
}

// 加载视频
function loadVideo(videoPath) {
    currentVideoPath = videoPath;
    currentVideoTitle.textContent = videoPath;

    // 设置视频源
    videoPlayer.src = `/video_stream/${encodeURIComponent(videoPath)}`;
    videoPlayer.load();

    // 启用视频控制
    prevFrameBtn.disabled = false;
    nextFrameBtn.disabled = false;
    playbackRateSelect.disabled = false;

    // 加载该视频的标注
    loadAnnotations(videoPath);
}

// 加载标注
async function loadAnnotations(videoPath) {
    if (!videoPath) return;

    try {
        const response = await fetch(`/annotations/${encodeURIComponent(videoPath)}`);
        const data = await response.json();

        if (response.ok) {
            // 获取当前用户的ID
            const currentUserId = localStorage.getItem('userId');

            // 保存完整的标注数据
            allAnnotationsData = data.data;

            // 新的简化方式：直接从annotations数组中过滤当前用户的标注和其他用户的标注
            currentAnnotations = (data.data.annotations || []).filter(
                annotation => annotation.userId === currentUserId
            );

            // 获取其他用户的标注
            otherUsersAnnotations = (data.data.annotations || []).filter(
                annotation => annotation.userId !== currentUserId
            );

            // 渲染标注列表
            renderAnnotationList();
        } else {
            showMessage('错误', data.message || '无法加载标注数据');
        }
    } catch (error) {
        showMessage('错误', `请求失败: ${error.message}`);
    }
}

// 渲染标注列表
function renderAnnotationList() {
    annotationListContainer.innerHTML = '';

    // 创建标注列表切换控件
    const annotationToggle = document.createElement('div');
    annotationToggle.className = 'btn-group w-100 mb-3';
    annotationToggle.innerHTML = `
        <input type="radio" class="btn-check" name="annotationView" id="myAnnotationsOnly" ${!isShowingAllAnnotations ? 'checked' : ''}>
        <label class="btn btn-outline-success" for="myAnnotationsOnly">仅我的标注</label>
        <input type="radio" class="btn-check" name="annotationView" id="allAnnotations" ${isShowingAllAnnotations ? 'checked' : ''}>
        <label class="btn btn-outline-primary" for="allAnnotations">所有标注</label>
    `;
    annotationListContainer.appendChild(annotationToggle);

    // 添加切换事件监听
    document.getElementById('myAnnotationsOnly').addEventListener('change', () => {
        isShowingAllAnnotations = false;
        renderAnnotationList();
    });
    document.getElementById('allAnnotations').addEventListener('change', () => {
        isShowingAllAnnotations = true;
        renderAnnotationList();
    });

    // 获取当前用户ID
    const currentUserId = localStorage.getItem('userId');

    // 确定要显示的标注集合
    let annotationsToShow = isShowingAllAnnotations ? [...currentAnnotations, ...otherUsersAnnotations] :
        currentAnnotations;

    // 如果没有标注数据
    if (annotationsToShow.length === 0) {
        const noDataMsg = document.createElement('div');
        noDataMsg.className = 'alert alert-info';
        noDataMsg.textContent = isShowingAllAnnotations ?
            '没有找到任何标注数据' :
            '您还没有添加任何标注';
        annotationListContainer.appendChild(noDataMsg);
        return;
    }

    // 创建标注项目
    annotationsToShow.forEach((annotation, index) => {
                const isCurrentUserAnnotation = annotation.userId === currentUserId;
                const annotationItem = document.createElement('div');

                // 设置样式类
                annotationItem.className = `annotation-item ${annotation.type}`;
                if (!isCurrentUserAnnotation) {
                    annotationItem.classList.add('others-annotation');
                }

                // 获取时间和帧信息
                let timeInfo = '';
                let frameInfo = '';

                if (annotation.type === 'interval') {
                    timeInfo = `${annotation.startTime} - ${annotation.endTime}`;

                    // 添加帧序号信息
                    if (annotation.startFrame !== undefined && annotation.endFrame !== undefined) {
                        frameInfo = `帧: ${annotation.startFrame} - ${annotation.endFrame}`;
                    }
                } else if (annotation.type === 'frame') {
                    timeInfo = annotation.timestamp;

                    // 添加帧序号信息
                    if (annotation.frameNumber !== undefined) {
                        frameInfo = `帧: ${annotation.frameNumber}`;
                    }
                }

                // 查找标注者信息
                let annotatorInfo = '';
                if (!isCurrentUserAnnotation && annotation.userId) {
                    // 尝试从allAnnotationsData获取标注者信息
                    let annotatorName = annotation.userId;
                    if (allAnnotationsData.annotators && allAnnotationsData.annotators[annotation.userId]) {
                        annotatorName = allAnnotationsData.annotators[annotation.userId].name;
                    }

                    annotatorInfo = `
                <small class="d-block text-primary">
                    <i class="bi bi-person"></i> ${annotatorName}
                </small>
            `;
                }

                // 构建HTML
                annotationItem.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    <strong>${annotation.label}</strong>
                    <small class="d-block text-muted">${timeInfo}</small>
                    ${frameInfo ? `<small class="d-block text-muted">${frameInfo}</small>` : ''}
                    ${annotatorInfo}
                </div>
                <div class="btn-group btn-group-sm">
                    ${isCurrentUserAnnotation ? `
                        <button class="btn btn-outline-primary btn-edit" data-index="${index}">编辑</button>
                        <button class="btn btn-outline-danger btn-delete" data-index="${index}">删除</button>
                    ` : `
                        <button class="btn btn-outline-secondary btn-view" data-index="${index}">查看</button>
                    `}
                </div>
            </div>
        `;
        
        // 点击标注跳转到对应时间点
        annotationItem.addEventListener('click', (e) => {
            // 忽略按钮点击
            if (e.target.tagName === 'BUTTON') return;
            
            let jumpTime = 0;
            if (annotation.type === 'interval') {
                jumpTime = parseTime(annotation.startTime);
            } else if (annotation.type === 'frame') {
                jumpTime = parseTime(annotation.timestamp);
            }
            
            if (jumpTime !== null) {
                videoPlayer.currentTime = jumpTime;
            }
        });
        
        // 添加事件监听器
        if (isCurrentUserAnnotation) {
            // 当前用户的标注 - 可编辑和删除
            const editBtn = annotationItem.querySelector('.btn-edit');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    const actualIndex = currentAnnotations.indexOf(annotation);
                    if (actualIndex !== -1) {
                        editAnnotation(actualIndex);
                    }
                });
            }
            
            const deleteBtn = annotationItem.querySelector('.btn-delete');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', () => {
                    const actualIndex = currentAnnotations.indexOf(annotation);
                    if (actualIndex !== -1) {
                        deleteAnnotation(actualIndex);
                    }
                });
            }
        } else {
            // 其他用户的标注 - 仅查看
            const viewBtn = annotationItem.querySelector('.btn-view');
            if (viewBtn) {
                viewBtn.addEventListener('click', () => {
                    // 跳转到视频对应位置
                    let jumpTime = 0;
                    if (annotation.type === 'interval') {
                        jumpTime = parseTime(annotation.startTime);
                    } else if (annotation.type === 'frame') {
                        jumpTime = parseTime(annotation.timestamp);
                    }
                    
                    if (jumpTime !== null) {
                        videoPlayer.currentTime = jumpTime;
                    }
                });
            }
        }
        
        // 点击标注跳转到对应时间点
        annotationItem.addEventListener('click', (e) => {
            // 忽略按钮点击
            if (e.target.tagName === 'BUTTON') return;
            
            let jumpTime = 0;
            if (annotation.type === 'interval') {
                jumpTime = parseTime(annotation.startTime);
            } else if (annotation.type === 'frame') {
                jumpTime = parseTime(annotation.timestamp);
            }
            
            if (jumpTime !== null) {
                videoPlayer.currentTime = jumpTime;
            }
        });
        
        annotationListContainer.appendChild(annotationItem);
    });
}

// 保存标注
async function saveAnnotation() {
    if (!currentVideoPath) {
        showMessage('错误', '请先选择一个视频');
        return;
    }
    
    const label = annotationLabelInput.value.trim();
    if (!label) {
        showMessage('错误', '请输入标注标签');
        return;
    }
    
    const type = intervalTypeRadio.checked ? 'interval' : 'frame';
    
    let annotation = {
        annotationId: crypto.randomUUID(),
        userId: localStorage.getItem('userId'),
        userName: localStorage.getItem('userName'),
        type: type,
        label: label,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    
    if (type === 'interval') {
        const startTime = startTimeInput.value.trim();
        const endTime = endTimeInput.value.trim();
        
        if (!startTime || !endTime) {
            showMessage('错误', '请设置开始和结束时间');
            return;
        }
        
        const startSeconds = parseTime(startTime);
        const endSeconds = parseTime(endTime);
        
        if (startSeconds === null || endSeconds === null) {
            showMessage('错误', '时间格式无效，请使用HH:MM:SS.mmm格式');
            return;
        }
        
        if (startSeconds >= endSeconds) {
            showMessage('错误', '开始时间必须早于结束时间');
            return;
        }
        
        annotation.startTime = startTime;
        annotation.endTime = endTime;
        // 添加帧序号（从0开始）
        annotation.startFrame = calculateFrameNumber(startSeconds);
        annotation.endFrame = calculateFrameNumber(endSeconds);
    } else {
        const frameTime = frameTimeInput.value.trim();
        
        if (!frameTime) {
            showMessage('错误', '请标记当前帧');
            return;
        }
        
        const frameSeconds = parseTime(frameTime);
        annotation.timestamp = frameTime;
        // 添加帧序号（从0开始）
        annotation.frameNumber = calculateFrameNumber(frameSeconds);
    }
    
    // 添加到当前标注列表
    currentAnnotations.push(annotation);
    
    // 保存到后端
    try {
        const videoFolder = localStorage.getItem('videoFolder');
        const userId = localStorage.getItem('userId');
        const userName = localStorage.getItem('userName');
        
        // 使用简化的JSON结构，只包含annotations字段
        const response = await fetch(`/annotations/${encodeURIComponent(currentVideoPath)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoFilePath: `${videoFolder}/${currentVideoPath}`,
                videoId: currentVideoPath,
                annotatorInfo: {
                    id: userId,
                    name: userName
                },
                annotations: currentAnnotations // 只使用annotations字段
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showMessage('成功', '标注已保存');
            
            // 清空输入
            annotationLabelInput.value = '';
            if (type === 'interval') {
                startTimeInput.value = '';
                endTimeInput.value = '';
            } else {
                frameTimeInput.value = '';
            }
            
            // 重新渲染标注列表
            renderAnnotationList();
            
            // 更新视频列表中的标注状态
            updateVideoItemStatus(currentVideoPath, currentAnnotations.length);
        } else {
            showMessage('错误', data.message || '保存标注失败');
        }
    } catch (error) {
        showMessage('错误', `请求失败: ${error.message}`);
    }
}

// 编辑标注
function editAnnotation(index) {
    const annotation = currentAnnotations[index];
    
    // 设置标注类型
    if (annotation.type === 'interval') {
        intervalTypeRadio.checked = true;
        intervalAnnotationSection.classList.remove('d-none');
        frameAnnotationSection.classList.add('d-none');
        
        startTimeInput.value = annotation.startTime;
        endTimeInput.value = annotation.endTime;
    } else {
        frameTypeRadio.checked = true;
        intervalAnnotationSection.classList.add('d-none');
        frameAnnotationSection.classList.remove('d-none');
        
        frameTimeInput.value = annotation.timestamp;
    }
    
    // 设置标签
    annotationLabelInput.value = annotation.label;
    
    // 删除当前标注
    currentAnnotations.splice(index, 1);
    
    // 更新UI
    renderAnnotationList();
}

// 删除标注
async function deleteAnnotation(index) {
    if (confirm('确定要删除此标注吗？')) {
        // 删除标注
        currentAnnotations.splice(index, 1);
        
        // 保存到后端
        try {
            const videoFolder = localStorage.getItem('videoFolder');
            const userId = localStorage.getItem('userId');
            const userName = localStorage.getItem('userName');
            
            const response = await fetch(`/annotations/${encodeURIComponent(currentVideoPath)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    videoFilePath: `${videoFolder}/${currentVideoPath}`,
                    videoId: currentVideoPath,
                    annotatorInfo: {
                        id: userId,
                        name: userName
                    },
                    annotations: currentAnnotations
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                showMessage('成功', '标注已删除');
                
                // 重新渲染标注列表
                renderAnnotationList();
                
                // 更新视频列表中的标注状态
                updateVideoItemStatus(currentVideoPath, currentAnnotations.length);
            } else {
                showMessage('错误', data.message || '删除标注失败');
            }
        } catch (error) {
            showMessage('错误', `请求失败: ${error.message}`);
        }
    }
}

// 初始化UI事件监听
function initUIEvents() {
    // 播放速度控制
    playbackRateSelect.addEventListener('change', () => {
        videoPlayer.playbackRate = parseFloat(playbackRateSelect.value);
    });
    
    // 播放器时间更新
    videoPlayer.addEventListener('timeupdate', () => {
        currentTimeDisplay.textContent = formatTime(videoPlayer.currentTime);
    });
    
    // 视频元数据加载完成
    videoPlayer.addEventListener('loadedmetadata', () => {
        durationDisplay.textContent = formatTime(videoPlayer.duration);
        
        // 尝试获取视频的帧率信息（如果可用）
        try {
            // 向后端请求视频元数据
            fetch(`/video_metadata/${encodeURIComponent(currentVideoPath)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success' && data.frameRate) {
                        videoFrameRate = data.frameRate;
                        console.log(`获取到视频帧率: ${videoFrameRate} fps`);
                    }
                })
                .catch(error => {
                    console.warn('获取视频帧率失败，使用默认值 30fps', error);
                });
        } catch (error) {
            console.warn('获取视频帧率失败，使用默认值 30fps', error);
        }
    });
    
    // 标注类型切换
    intervalTypeRadio.addEventListener('change', () => {
        if (intervalTypeRadio.checked) {
            intervalAnnotationSection.classList.remove('d-none');
            frameAnnotationSection.classList.add('d-none');
        }
    });
    
    frameTypeRadio.addEventListener('change', () => {
        if (frameTypeRadio.checked) {
            intervalAnnotationSection.classList.add('d-none');
            frameAnnotationSection.classList.remove('d-none');
        }
    });
    
    // 设置开始时间
    setStartTimeBtn.addEventListener('click', () => {
        startTimeInput.value = formatTime(videoPlayer.currentTime);
    });
    
    // 设置结束时间
    setEndTimeBtn.addEventListener('click', () => {
        endTimeInput.value = formatTime(videoPlayer.currentTime);
    });
    
    // 设置帧时间
    setFrameTimeBtn.addEventListener('click', () => {
        frameTimeInput.value = formatTime(videoPlayer.currentTime);
    });
    
    // 逐帧控制
    prevFrameBtn.addEventListener('click', () => {
        // 假设每秒30帧，后续可从视频元数据中获取
        videoPlayer.currentTime = Math.max(0, videoPlayer.currentTime - 1/30);
    });
    
    nextFrameBtn.addEventListener('click', () => {
        videoPlayer.currentTime = Math.min(videoPlayer.duration, videoPlayer.currentTime + 1/30);
    });
}

// 更新视频列表项状态
function updateVideoItemStatus(videoPath, userAnnotationsCount) {
    // 查找对应的视频列表项
    const videoItems = document.querySelectorAll('.video-item');
    
    // 计算其他用户的标注数量
    const otherUsersCount = otherUsersAnnotations.length;
    
    for (const item of videoItems) {
        if (item.dataset.path === videoPath) {
            // 移除所有标注相关类
            item.classList.remove('user-annotated', 'others-annotated', 'mixed-annotated');
            
            // 根据标注情况设置适当的类
            if (userAnnotationsCount > 0 && otherUsersCount > 0) {
                item.classList.add('mixed-annotated');
            } else if (userAnnotationsCount > 0) {
                item.classList.add('user-annotated');
            } else if (otherUsersCount > 0) {
                item.classList.add('others-annotated');
            }
            
            // 更新视频项内容
            // 为了简化，我们重新加载整个视频列表
            loadVideoList();
            break;
        }
    }
}

// 导出可视化
async function exportVisuals() {
    if (!currentVideoPath) {
        showMessage('错误', '请先选择一个视频');
        return;
    }
    
    if (!currentAnnotations || currentAnnotations.length === 0) {
        showMessage('提示', '当前视频没有标注数据');
        return;
    }
    
    const outputDir = prompt('请输入导出目录路径（完整路径）：', '');
    if (!outputDir) return;
    
    try {
        // 显示加载中
        exportVisualsBtn.disabled = true;
        exportVisualsBtn.textContent = '正在导出...';
        
        const response = await fetch('/export_visual', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                videoPath: currentVideoPath,
                outputDir: outputDir
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            // 保存导出目录到localStorage
            localStorage.setItem('lastExportDir', outputDir);
            
            showMessage('成功', `导出完成！\n文件已保存至: ${data.output_dir}`);
        } else {
            showMessage('错误', data.message || '导出失败');
        }
    } catch (error) {
        showMessage('错误', `请求失败: ${error.message}`);
    } finally {
        // 恢复按钮状态
        exportVisualsBtn.disabled = false;
        exportVisualsBtn.textContent = '导出可视化';
    }
}

// 初始化
window.addEventListener('DOMContentLoaded', () => {
    // 初始化Bootstrap模态框
    messageModal = new bootstrap.Modal(messageModalElement);
    
    initUIEvents();
    
    // 绑定保存标注按钮
    saveAnnotationBtn.addEventListener('click', saveAnnotation);
    
    // 绑定导出可视化按钮
    exportVisualsBtn.addEventListener('click', exportVisuals);
    
    // 绑定打开文件夹按钮
    openFolderBtn.addEventListener('click', openLocalFolder);
    
    // 绑定打开导出目录按钮
    openExportDirBtn.addEventListener('click', openExportDir);
});

// 打开本地文件夹
async function openLocalFolder() {
    try {
        const folderPath = localStorage.getItem('videoFolder');
        
        if (!folderPath) {
            showMessage('错误', '请先配置视频文件夹路径');
            return;
        }
        
        const response = await fetch('/open_folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: folderPath
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showMessage('成功', '已打开文件夹');
        } else {
            showMessage('错误', data.message || '无法打开文件夹');
        }
    } catch (error) {
        showMessage('错误', `请求失败: ${error.message}`);
    }
}

// 打开导出目录
async function openExportDir() {
    try {
        const outputDir = localStorage.getItem('lastExportDir');
        
        if (!outputDir) {
            showMessage('提示', '请先导出可视化到一个目录');
            return;
        }
        
        const response = await fetch('/open_folder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                path: outputDir
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.status === 'success') {
            showMessage('成功', '已打开导出目录');
        } else {
            showMessage('错误', data.message || '无法打开导出目录');
        }
    } catch (error) {
        showMessage('错误', `请求失败: ${error.message}`);
    }
}