const quoteText = document.getElementById('quote-text');
const quoteAuthor = document.getElementById('quote-author');
const newQuoteBtn = document.getElementById('new-quote-btn');
const tweetBtn = document.getElementById('tweet-btn');

// Local quote list (expanded to 100+ items)
const fallbackQuotes = [
    // --- 伝統的・歴史的名言 ---
    { quote: "為せば成る、為さねば成らぬ、何事も、成らぬは人の為さぬなりけり", author: "上杉鷹山" },
    { quote: "人生は、大いなる戦場である", author: "島崎藤村" },
    { quote: "人事を尽くして天命を待つ", author: "ことわざ" },
    { quote: "千里の道も一歩から", author: "ことわざ" },
    { quote: "継続は力なり", author: "ことわざ" },
    { quote: "案ずるより産むが易し", author: "ことわざ" },
    { quote: "習うより慣れろ", author: "ことわざ" },
    { quote: "人の一生は重荷を負うて遠き道を 行くがごとし。急ぐべからず", author: "徳川家康" },
    { quote: "芸術は爆発だ！", author: "岡本太郎" },
    { quote: "人を信じよ、しかし、その百倍も自らを信じよ", author: "手塚治虫" },
    { quote: "徳は孤ならず必ず隣有り", author: "論語" },
    { quote: "義を見てせざるは勇無きなり", author: "論語" },
    { quote: "君子は言に訥にして、行いに敏ならんと欲す", author: "論語" },
    { quote: "朝に道を聞かば夕べに死すとも可なり", author: "論語" },
    { quote: "蓼食う虫も好き好き", author: "ことわざ" },
    { quote: "勝って兜の緒を締めよ", author: "北条氏綱" },
    { quote: "人こそが城、人こそが石垣、人こそが堀", author: "武田信玄" },
    { quote: "事を遂げる者は愚直でなければならぬ。才走ってはうまくいかない", author: "勝海舟" },
    { quote: "一期一会", author: "千利休" },
    { quote: "努力は必ず報われる", author: "王貞治" },
    { quote: "今日をなすは昨日なり、明日をなすは今日なり", author: "吉田松陰" },
    { quote: "生きることは息をすることではない、行動することだ", author: "ジャン・ジャック・ルソー" },
    { quote: "友を選ぶには、善良な人を選びなさい", author: "福沢諭吉" },
    { quote: "散る桜、残る桜も散る桜", author: "良寛" },
    { quote: "面白きこともなき世を面白く", author: "高杉晋作" },
    { quote: "人間は、負けたら終わりなのではない。辞めたら終わりなのだ", author: "本田宗一郎" },
    { quote: "最も辛い道を選ぶのが、成功への近道だ", author: "松下幸之助" },
    { quote: "無理が通れば道理が引っ込む", author: "ことわざ" },
    { quote: "負けるが勝ち", author: "ことわざ" },
    { quote: "努力に勝る天才なし", author: "ことわざ" },
    { quote: "失敗は成功のもと", author: "ことわざ" },
    { quote: "時は金なり", author: "ことわざ" },
    { quote: "笑う門には福来る", author: "ことわざ" },
    { quote: "石の上にも三年", author: "ことわざ" },
    { quote: "七転び八起き", author: "ことわざ" },
    { quote: "一日一生", author: "宮本武蔵" },
    { quote: "おのれの心に恥じることなかれ", author: "坂本龍馬" },
    { quote: "悔いを残さず、やりきる", author: "イチロー" },
    { quote: "夢なき者に成功なし", author: "吉田松陰" },
    { quote: "貧乏もまた楽し", author: "ことわざ" },
    { quote: "月日は百代の過客にして、行き交う年もまた旅人なり", author: "松尾芭蕉" },
    { quote: "山椒は小粒でもぴりりと辛い", author: "ことわざ" },
    { quote: "出る杭は打たれる", author: "ことわざ" },
    { quote: "無駄をなくせば、豊かになる", author: "本田宗一郎" },
    { quote: "天才とは、1％のひらめきと99％の努力である", author: "トーマス・エジソン" },
    { quote: "明日死ぬかのように生きよ。永遠に生きるかのように学べ", author: "マハトマ・ガンディー" },

    // --- アニメ・漫画の名言 ---
    { quote: "諦めたらそこで試合終了ですよ", author: "安西先生（SLAM DUNK）" },
    { quote: "嫌な時はなぁ、逃げたっていいんだよ！", author: "霊幻新隆（モブサイコ100）" },
    { quote: "まっすぐ自分の言葉は曲げねぇ。それがオレの忍道だ！", author: "うずまきナルト（NARUTO）" },
    { quote: "逃げちゃダメだ、逃げちゃダメだ、逃げちゃダメだ", author: "碇シンジ（エヴァンゲリオン）" },
    { quote: "人は思い出を忘れることで生きていける。だが、決して忘れてはならないこともある", author: "碇ゲンドウ（エヴァンゲリオン）" },
    { quote: "何百万本もうってきたシュートだ", author: "三井寿（SLAM DUNK）" },
    { quote: "人の夢は!!! 終わらねぇ!!!!", author: "マーシャル・D・ティーチ（ONE PIECE）" },
    { quote: "おれは人間をやめるぞ!ジョジョーッ!!", author: "ディオ・ブランドー（ジョジョの奇妙な冒険）" },
    { quote: "だが断る", author: "岸辺露伴（ジョジョの奇妙な冒険）" },
    { quote: "自分が死ぬときのことは分からんけど 生き様で後悔はしたくない", author: "虎杖悠仁（呪術廻戦）" },
    { quote: "『死んで勝つ』と『死んでも勝つ』は 全然違うよ恵", author: "五条悟（呪術廻戦）" },
    { quote: "ボールはともだち", author: "大空翼（キャプテン翼）" },
    { quote: "お前はもう死んでいる", author: "ケンシロウ（北斗の拳）" },
    { quote: "海賊王に!!! おれはなるっ!!!!", author: "モンキー・D・ルフィ（ONE PIECE）" },
    { quote: "背中の傷は剣士の恥だ", author: "ロロノア・ゾロ（ONE PIECE）" },
    { quote: "いつかまた会えたら、もう一度仲間と呼んでくれますか？", author: "ネフェルタリ・ビビ（ONE PIECE）" },
    { quote: "撃っていいのは撃たれる覚悟のある奴だけだ", author: "ルルーシュ・ランペルージ（コードギアス）" },
    { quote: "真実はいつもひとつ！", author: "江戸川コナン（名探偵コナン）" },
    { quote: "動け、動け、動け！", author: "碇シンジ（エヴァンゲリオン）" },
    { quote: "月に代わってお仕置きよ！", author: "セーラームーン" },
    { quote: "我が生涯に一片の悔いなし", author: "ラオウ（北斗の拳）" },
    { quote: "上には上がいる", author: "はたけカカシ（NARUTO）" },
    { quote: "才能は開花させるもの、センスは磨くもの", author: "及川徹（ハイキュー!!）" },
    { quote: "負けたくないことに理由って要る？", author: "日向翔陽（ハイキュー!!）" },
    { quote: "駆逐してやる!! この世から…一匹残らず!!", author: "エレン・イェーガー（進撃の巨人）" },
    { quote: "心臓を捧げよ！", author: "エルヴィン・スミス（進撃の巨人）" },
    { quote: "なんにもないなら、なんでもできる！", author: "野原しんのすけ（クレヨンしんちゃん）" },
    { quote: "ねだるな、勝ち取れ。さすれば与えられん", author: "レントン（エウレカセブン）" },
    { quote: "やっちゃえ バーサーカー！", author: "イリヤスフィール（Fate/stay night）" },
    { quote: "問おう、貴方が私のマスターか", author: "セイバー（Fate/stay night）" },
    { quote: "強い言葉を使うなよ 弱く見えるぞ", author: "藍染惣右介（BLEACH）" },
    { quote: "あまり強い言葉を使うなよ 弱く見えるぞ", author: "藍染惣右介（BLEACH）" },
    { quote: "憧れは理解から最も遠い感情だよ", author: "藍染惣右介（BLEACH）" },
    { quote: "なん…だと…", author: "（BLEACH）" },
    { quote: "立って歩け 前へ進め あんたには立派な足がついてるじゃないか", author: "エドワード・エルリック（鋼の錬金術師）" },
    { quote: "等価交換だ 俺の人生半分やるから お前の人生半分くれ！", author: "エドワード・エルリック（鋼の錬金術師）" },
    { quote: "雨が降ってる……", author: "ロイ・マスタング（鋼の錬金術師）" },
    { quote: "君の膵臓をたべたい", author: "山内桜良（君の膵臓をたべたい）" },
    { quote: "私の戦闘力は530000です", author: "フリーザ（ドラゴンボール）" },
    { quote: "認めたくないものだな、自分自身の若さ故のあやまちというものを", author: "シャア・アズナブル（ガンダム）" },
    { quote: "坊やだからさ", author: "シャア・アズナブル（ガンダム）" },
    { quote: "あえて言おう、カスであると！", author: "ギレン・ザビ（ガンダム）" },
    { quote: "悲しいけどこれ戦争なのよね", author: "スレッガー・ロウ（ガンダム）" },
    { quote: "アムロ、行きまーす！", author: "アムロ・レイ（ガンダム）" },
    { quote: "殴ったね！親父にもぶたれたことないのに！", author: "アムロ・レイ（ガンダム）" },
    { quote: "運命を変えるのが、私の力", author: "暁美ほむら（まどか☆マギカ）" },
    { quote: "わけがわからないよ", author: "キュゥべえ（まどか☆マギカ）" },
    { quote: "奇跡も、魔法も、あるんだよ", author: "美樹さやか（まどか☆マギカ）" },
    { quote: "あんたバカぁ？", author: "惣流・アスカ・ラングレー（エヴァンゲリオン）" },
    { quote: "笑えばいいと思うよ", author: "碇シンジ（エヴァンゲリオン）" },
    { quote: "40秒で支度しな！", author: "ドーラ（天空の城ラピュタ）" },
    { quote: "バルス！", author: "パズー＆シータ（天空の城ラピュタ）" },
    { quote: "見ろ、人がゴミのようだ！", author: "ムスカ（天空の城ラピュタ）" },
    { quote: "飛ばねえ豚はただの豚だ", author: "マルコ（紅の豚）" },
    { quote: "生きろ。そなたは美しい", author: "アシタカ（もののけ姫）" },
    { quote: "黙れ小僧！", author: "モロの君（もののけ姫）" },
    { quote: "一度あったことは忘れないものさ。思い出せないだけで", author: "銭婆（千と千尋の神隠し）" },
    { quote: "ここで働かせてください！", author: "千尋（千と千尋の神隠し）" },
    { quote: "俺の敵は、だいたい俺です", author: "南波六太（宇宙兄弟）" },
    { quote: "本気の失敗には価値がある", author: "南波六太（宇宙兄弟）" },
    { quote: "金は命より重い・・・！", author: "利根川幸雄（カイジ）" },
    { quote: "明日からがんばるんじゃない…今日…今日だけがんばるんだ…！", author: "大槻班長（カイジ）" },
];

// Helper to pick random item
function getRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function getNewQuote() {
    // Add a simple loading effect for UX
    showLoading();

    // Simulate network delay slightly for better feel, or just show immediately.
    // Showing immediately feels snappier.
    setTimeout(() => {
        const randomQuote = getRandom(fallbackQuotes);
        displayQuote(randomQuote.quote, randomQuote.author);
    }, 200);
}

function displayQuote(quote, author) {
    quoteText.textContent = quote;
    quoteAuthor.textContent = author;
    updateTweetLink(quote, author);
}

function showLoading() {
    quoteText.textContent = "...";
    quoteAuthor.textContent = "";
}

function updateTweetLink(quote, author) {
    const text = `"${quote}" - ${author}`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    tweetBtn.onclick = () => window.open(url, '_blank');
}

// Event Listeners
newQuoteBtn.addEventListener('click', getNewQuote);

// Initial Load
getNewQuote();
