document.addEventListener(`DOMContentLoaded`, function() {
    // DOM要素の取得
    const fileInput = document.getElementById(`excelFile`);
    const loadButton = document.getElementById(`loadButton`);
    const clearDataButton = document.getElementById(`clearDataButton`);
    const fileInfo = document.getElementById(`fileInfo`);
    const fileSection = document.getElementById(`file-section`);
    const quizSection = document.getElementById(`quiz-section`);
    const resultsSection = document.getElementById(`results-section`);
    const questionText = document.getElementById(`question-text`);
    const userAnswer = document.getElementById(`user-answer`);
    const submitButton = document.getElementById(`submit-answer`);
    const feedback = document.getElementById(`feedback`);
    const feedbackText = document.getElementById(`feedback-text`);
    const correctAnswer = document.getElementById(`correct-answer`);
    const nextButton = document.getElementById(`next-question`);
    const restartButton = document.getElementById(`restart-quiz`);
    const homeButtonQuiz = document.getElementById(`home-button-quiz`);
    const homeButtonResults = document.getElementById(`home-button-results`);
    const totalQuestionsElement = document.getElementById(`totalQuestions`);
    const correctAnswersElement = document.getElementById(`correctAnswers`);
    const incorrectAnswersElement = document.getElementById(`incorrectAnswers`);
    const accuracyElement = document.getElementById(`accuracy`);
    const missedQuestionsList = document.getElementById(`missed-questions`);

    // 問題データを保存する変数
    let questions = [];
    let remainingQuestions = []; // 出題されていない問題のインデックス配列
    let correctCount = 0;
    let incorrectCount = 0;
    let missedQuestions = [];
    let questionStats = {};
    
    // 前回のデータがあれば読み込む
    loadSavedData();

    // Excelファイルを読み込む
    loadButton.addEventListener(`click`, function() {
        const file = fileInput.files[0];
        
        if (!file) {
            alert(`ファイルを選択してください`);
            return;
        }

        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: `array` });
                
                // 最初のシートを取得
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // シートのデータを配列に変換
                const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                // 問題と回答を抽出
                questions = sheetData.filter(row => row[0] && row[1]).map(row => {
                    return {
                        question: row[0],
                        answer: row[1],
                        attempts: 0,
                        incorrectAttempts: 0
                    };
                });
                
                if (questions.length === 0) {
                    alert(`有効な問題が見つかりませんでした。A列に問題、B列に回答が入力されているか確認してください。`);
                    return;
                }
                
                // 問題統計の初期化
                questions.forEach((q, index) => {
                    questionStats[index] = {
                        question: q.question,
                        answer: q.answer,
                        attempts: 0,
                        incorrectAttempts: 0
                    };
                });
                
                // ファイル情報を表示
                fileInfo.style.display = `block`;
                fileInfo.textContent = `${file.name}から${questions.length}問の問題を読み込みました。`;
                
                // ファイル名とデータを保存
                saveQuizData(file.name, questions);
                
                // クイズを開始
                startQuiz();
                
            } catch (error) {
                console.error(`ファイル読み込みエラー:`, error);
                alert(`ファイルの読み込み中にエラーが発生しました。`);
            }
        };
        
        reader.onerror = function() {
            alert(`ファイルの読み込み中にエラーが発生しました。`);
        };
        
        reader.readAsArrayBuffer(file);
    });

    // 配列をシャッフルする関数（Fisher-Yates shuffle）
    function shuffleArray(array) {
        const shuffled = [...array]; // 元の配列のコピーを作成
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // クイズを開始する関数
    function startQuiz() {
        // 状態をリセット
        correctCount = 0;
        incorrectCount = 0;
        missedQuestions = [];
        
        // 出題されていない問題のインデックス配列を初期化
        // すべての問題のインデックスを配列に入れてシャッフル
        remainingQuestions = shuffleArray(Array.from({length: questions.length}, (_, i) => i));
        
        // 統計情報を表示
        updateStats();
        
        // セクションの表示切替
        fileSection.classList.add(`hidden`);
        quizSection.classList.remove(`hidden`);
        resultsSection.classList.add(`hidden`);
        
        // 最初の問題を表示
        nextQuestion();
    }

    // 次の問題を表示する関数
    function nextQuestion() {
        // フィードバックをクリア
        feedback.classList.add(`hidden`);
        feedback.classList.remove(`correct`, `incorrect`);
        userAnswer.value = ``;
        nextButton.classList.add(`hidden`);
        
        // すべての問題が終了したかチェック
        if (remainingQuestions.length === 0) {
            showResults();
            return;
        }
        
        // 残りの問題から1つを取り出して表示
        const currentQuestionIndex = remainingQuestions[0];
        const currentQuestion = questions[currentQuestionIndex];
        
        // 問題を表示
        const questionNumber = questions.length - remainingQuestions.length + 1;
        questionText.textContent = `問題 ${questionNumber} / ${questions.length}: ${currentQuestion.question}`;
        
        // 入力欄にフォーカス
        userAnswer.focus();
    }

    // 回答をチェックする関数
    function checkAnswer() {
        if (remainingQuestions.length === 0) {
            showResults();
            return;
        }
        
        const userInput = userAnswer.value.trim();
        
        // 現在の問題のインデックスを取得して配列から削除
        const currentQuestionIndex = remainingQuestions.shift();
        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = userInput === currentQuestion.answer;
        
        // 問題の統計を更新
        questionStats[currentQuestionIndex].attempts++;
        
        if (isCorrect) {
            // 正解の場合
            feedbackText.textContent = `正解です！`;
            feedback.classList.add(`correct`);
            correctCount++;
            correctAnswersElement.textContent = correctCount;
        } else {
            // 不正解の場合
            feedbackText.textContent = `不正解です。`;
            feedback.classList.add(`incorrect`);
            incorrectCount++;
            incorrectAnswersElement.textContent = incorrectCount;
            
            // 不正解の問題を記録
            questionStats[currentQuestionIndex].incorrectAttempts++;
            missedQuestions.push({
                question: currentQuestion.question,
                userAnswer: userInput,
                correctAnswer: currentQuestion.answer
            });
        }
        
        // 正解を表示
        correctAnswer.textContent = currentQuestion.answer;
        
        // フィードバックを表示
        feedback.classList.remove(`hidden`);
        nextButton.classList.remove(`hidden`);
        
        // 統計を更新
        updateStats();
        
        // 学習データを保存
        saveProgress();
        
        // すべての問題に解答したかチェック
        if (remainingQuestions.length === 0) {
            // 「次の問題」ボタンのテキストを変更
            nextButton.textContent = `結果を表示`;
        }
    }

    // 統計を更新する関数
    function updateStats() {
        totalQuestionsElement.textContent = questions.length;
        correctAnswersElement.textContent = correctCount;
        incorrectAnswersElement.textContent = incorrectCount;
    }

    // 結果を表示する関数
    function showResults() {
        quizSection.classList.add(`hidden`);
        resultsSection.classList.remove(`hidden`);
        
        // 正解率を計算
        const total = correctCount + incorrectCount;
        const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
        accuracyElement.textContent = accuracy;
        
        // 間違えた問題のリストを表示
        missedQuestionsList.innerHTML = ``;
        missedQuestions.forEach(item => {
            const li = document.createElement(`li`);
            li.innerHTML = `
                <strong>問題:</strong> ${item.question}<br>
                <strong>あなたの回答:</strong> ${item.userAnswer}<br>
                <strong>正解:</strong> ${item.correctAnswer}
            `;
            missedQuestionsList.appendChild(li);
        });
        
        // 間違いの多い問題をランキング表示
        const rankingList = Object.values(questionStats)
            .filter(q => q.incorrectAttempts > 0)
            .sort((a, b) => b.incorrectAttempts - a.incorrectAttempts)
            .slice(0, 5);
        
        if (rankingList.length > 0) {
            const rankingTitle = document.createElement(`h3`);
            rankingTitle.textContent = `間違いの多い問題ランキング`;
            missedQuestionsList.appendChild(rankingTitle);
            
            rankingList.forEach((item, index) => {
                const li = document.createElement(`li`);
                li.innerHTML = `
                    <strong>${index + 1}位:</strong> ${item.question}<br>
                    <strong>正解:</strong> ${item.answer}<br>
                    <strong>間違えた回数:</strong> ${item.incorrectAttempts}
                `;
                missedQuestionsList.appendChild(li);
            });
        }
    }

    // イベントリスナーの設定
    submitButton.addEventListener(`click`, checkAnswer);
    userAnswer.addEventListener(`keypress`, function(e) {
        if (e.key === `Enter`) {
            checkAnswer();
        }
    });
    
    nextButton.addEventListener(`click`, nextQuestion);
    restartButton.addEventListener(`click`, startQuiz);
    
    // ホームボタンのイベントリスナー
    homeButtonQuiz.addEventListener(`click`, goToHome);
    homeButtonResults.addEventListener(`click`, goToHome);
    
    // クリアボタンのイベントリスナー
    clearDataButton.addEventListener(`click`, function() {
        if (confirm(`保存されたデータをすべて削除しますか？この操作は元に戻せません。`)) {
            clearSavedData();
            location.reload(); // ページを再読み込み
        }
    });
    
    // ローカルストレージにクイズデータを保存する関数
    function saveQuizData(fileName, quizQuestions) {
        try {
            localStorage.setItem(`itpassport_quiz_filename`, fileName);
            localStorage.setItem(`itpassport_quiz_questions`, JSON.stringify(quizQuestions));
            console.log(`問題データを保存しました`);
        } catch (error) {
            console.error(`データ保存エラー:`, error);
        }
    }
    
    // 進捗データを保存する関数
    function saveProgress() {
        try {
            localStorage.setItem(`itpassport_quiz_stats`, JSON.stringify(questionStats));
            localStorage.setItem(`itpassport_quiz_correct`, correctCount);
            localStorage.setItem(`itpassport_quiz_incorrect`, incorrectCount);
            localStorage.setItem(`itpassport_quiz_missed`, JSON.stringify(missedQuestions));
            localStorage.setItem(`itpassport_quiz_remaining`, JSON.stringify(remainingQuestions));
            console.log(`進捗データを保存しました`);
        } catch (error) {
            console.error(`進捗データ保存エラー:`, error);
        }
    }
    
    // 保存されたデータを読み込む関数
    function loadSavedData() {
        try {
            // 保存された問題データがあるか確認
            const savedQuestions = localStorage.getItem(`itpassport_quiz_questions`);
            const fileName = localStorage.getItem(`itpassport_quiz_filename`);
            
            if (savedQuestions && fileName) {
                questions = JSON.parse(savedQuestions);
                
                // 統計データを読み込む
                const savedStats = localStorage.getItem(`itpassport_quiz_stats`);
                if (savedStats) {
                    questionStats = JSON.parse(savedStats);
                } else {
                    // 統計データがない場合は初期化
                    questions.forEach((q, index) => {
                        questionStats[index] = {
                            question: q.question,
                            answer: q.answer,
                            attempts: 0,
                            incorrectAttempts: 0
                        };
                    });
                }
                
                // 正解・不正解数を読み込む
                const savedCorrect = localStorage.getItem(`itpassport_quiz_correct`);
                const savedIncorrect = localStorage.getItem(`itpassport_quiz_incorrect`);
                const savedMissed = localStorage.getItem(`itpassport_quiz_missed`);
                const savedRemaining = localStorage.getItem(`itpassport_quiz_remaining`);
                
                if (savedCorrect) correctCount = parseInt(savedCorrect);
                if (savedIncorrect) incorrectCount = parseInt(savedIncorrect);
                if (savedMissed) missedQuestions = JSON.parse(savedMissed);
                if (savedRemaining) remainingQuestions = JSON.parse(savedRemaining);
                
                // ファイル情報を表示
                fileInfo.style.display = `block`;
                fileInfo.textContent = `${fileName}から${questions.length}問の問題を読み込みました（前回のデータ）`;
                
                // ユーザーに確認
                if (confirm(`前回のクイズデータが見つかりました。続けますか？`)) {
                    // クイズセクションを表示
                    fileSection.classList.add(`hidden`);
                    quizSection.classList.remove(`hidden`);
                    
                    // 統計情報を更新
                    updateStats();
                    
                    // 残りの問題があるかチェック
                    if (remainingQuestions && remainingQuestions.length > 0) {
                        // 続きから開始
                        nextQuestion();
                    } else if (correctCount + incorrectCount >= questions.length) {
                        // すべての問題が終了している場合
                        showResults();
                    } else {
                        // 残りの問題がない場合は新しく開始
                        startQuiz();
                    }
                    
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error(`データ読み込みエラー:`, error);
            return false;
        }
    }
    
    // データをクリアする関数（必要に応じて使用）
    function clearSavedData() {
        localStorage.removeItem(`itpassport_quiz_filename`);
        localStorage.removeItem(`itpassport_quiz_questions`);
        localStorage.removeItem(`itpassport_quiz_stats`);
        localStorage.removeItem(`itpassport_quiz_correct`);
        localStorage.removeItem(`itpassport_quiz_incorrect`);
        localStorage.removeItem(`itpassport_quiz_missed`);
        localStorage.removeItem(`itpassport_quiz_remaining`);
        console.log(`保存データをクリアしました`);
    }
    
    // ホーム画面に戻る関数
    function goToHome() {
        // 現在の進捗状況を確認
        if (remainingQuestions && remainingQuestions.length > 0 && (correctCount > 0 || incorrectCount > 0)) {
            // クイズ途中の場合は確認ダイアログを表示
            if (!confirm(`クイズが途中です。ホームに戻ると進捗が保存され、後で続きから再開できます。ホームに戻りますか？`)) {
                return;
            }
            
            // 進捗を保存
            saveProgress();
        }
        
        // すべてのセクションを非表示にして、ファイル選択画面を表示
        quizSection.classList.add(`hidden`);
        resultsSection.classList.add(`hidden`);
        fileSection.classList.remove(`hidden`);
        
        // 「次の問題」ボタンのテキストを元に戻す
        nextButton.textContent = `次の問題`;
        
        // フィードバックセクションをリセット
        feedback.classList.add(`hidden`);
        feedback.classList.remove(`correct`, `incorrect`);
        userAnswer.value = ``;
        nextButton.classList.add(`hidden`);
    }
});
