class NumberGame {
    constructor() {
        this.games = [];
        this.currentGameIndex = 0;
        this.selectedNumber = null;
        this.selectedOperation = null;
        this.stats = this.loadStats();
        this.giveUpConfirmationLevel = 0;
        
        this.loadOrInitializeGames();
        this.loadTheme();
        this.attachEventListeners();
        this.renderGamesBar();
        this.loadGame(this.currentGameIndex);
    }

    loadTheme() {
        const savedTheme = localStorage.getItem('additionalTheme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-mode');
            document.getElementById('themeBtn').textContent = '☀';
            document.getElementById('themeBtn').title = 'Modo claro';
        } else {
            document.getElementById('themeBtn').textContent = '🌙';
            document.getElementById('themeBtn').title = 'Modo oscuro';
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        
        if (isDark) {
            localStorage.setItem('additionalTheme', 'dark');
            document.getElementById('themeBtn').textContent = '☀';
            document.getElementById('themeBtn').title = 'Modo claro';
        } else {
            localStorage.setItem('additionalTheme', 'light');
            document.getElementById('themeBtn').textContent = '🌙';
            document.getElementById('themeBtn').title = 'Modo oscuro';
        }
    }

    loadStats() {
        const saved = localStorage.getItem('additionalStats');
        return saved ? JSON.parse(saved) : {
            completed: 0,
            totalMoves: 0
        };
    }

    saveStats() {
        localStorage.setItem('additionalStats', JSON.stringify(this.stats));
    }

    loadOrInitializeGames() {
        const savedGames = localStorage.getItem('additionalGames');
        const savedIndex = localStorage.getItem('additionalCurrentGame');
        
        if (savedGames) {
            this.games = JSON.parse(savedGames);
            
            this.games.forEach(game => {
                if (game.giveUpConfirmed === undefined) {
                    game.giveUpConfirmed = false;
                }
            });
            
            this.currentGameIndex = savedIndex ? parseInt(savedIndex) : 0;
            
            const allCompleted = this.games.every(g => g.completed);
            
            if (allCompleted) {
                this.currentGameIndex = 0;
                localStorage.removeItem('additionalGames');
                localStorage.removeItem('additionalCurrentGame');
                this.initializeGames();
                this.saveGames();
            }
        } else {
            this.initializeGames();
            this.saveGames();
        }
    }

    saveGames() {
        localStorage.setItem('additionalGames', JSON.stringify(this.games));
        localStorage.setItem('additionalCurrentGame', this.currentGameIndex.toString());
    }

    initializeGames() {
        this.games = [];
        
        for (let i = 0; i < 5; i++) {
            let attempts = 0;
            let success = false;
            let gameData = null;
            
            while (!success && attempts < 100) {
                const numbers = this.generateNumbers();
                const result = this.generateTarget([...numbers]);
                
                if (result.success) {
                    gameData = {
                        target: result.target,
                        numbers: numbers,
                        availableNumbers: [...numbers],
                        history: [],
                        completed: false,
                        stars: 0,
                        moves: 0,
                        giveUpConfirmed: false
                    };
                    success = true;
                }
                attempts++;
            }
            
            if (gameData) {
                this.games.push(gameData);
            }
        }
        
        this.games = this.games.slice(0, 5);
    }

    renderGamesBar() {
        const gamesBar = document.getElementById('gamesBar');
        gamesBar.innerHTML = '';
        
        this.games.forEach((game, index) => {
            const tab = document.createElement('div');
            tab.className = 'game-tab';
            if (index === this.currentGameIndex) tab.classList.add('active');
            if (game.completed) tab.classList.add('completed');
            
            const number = document.createElement('div');
            number.className = 'game-number';
            number.textContent = game.target;
            
            const stars = document.createElement('div');
            stars.className = 'game-stars';
            stars.textContent = game.completed ? '★★★' : '☆☆☆';
            
            tab.appendChild(number);
            tab.appendChild(stars);
            tab.onclick = () => this.loadGame(index);
            
            gamesBar.appendChild(tab);
        });
    }

    loadGame(index) {
        if (index < 0 || index >= this.games.length) return;
        
        this.currentGameIndex = index;
        this.selectedNumber = null;
        this.selectedOperation = null;
        this.giveUpConfirmationLevel = 0;
        
        document.getElementById('solutionBanner').classList.remove('show');
        localStorage.setItem('additionalCurrentGame', this.currentGameIndex.toString());
        
        this.renderGamesBar();
        this.render();
    }

    getCurrentGame() {
        return this.games[this.currentGameIndex];
    }

    generateNumbers() {
        const numbers = [];
        
        const smallCount = Math.floor(Math.random() * 2) + 2;
        for (let i = 0; i < smallCount; i++) {
            numbers.push(Math.floor(Math.random() * 10) + 1);
        }
        
        const mediumCount = Math.min(1 + Math.floor(Math.random() * 2), 6 - numbers.length);
        for (let i = 0; i < mediumCount; i++) {
            numbers.push(Math.floor(Math.random() * 10) + 11);
        }
        
        
        while (numbers.length < 6) {
            const type = Math.random();
            if (type < 0.4) {
                const multiplier = Math.floor(Math.random() * 4) + 1;
                numbers.push(multiplier * 25);
            } else if (type < 0.7) {
                const multiplier = Math.floor(Math.random() * 10) + 1;
                numbers.push(multiplier * 10);
            } else {
                const multiplier = Math.floor(Math.random() * 10) + 1;
                numbers.push(multiplier * 5);
            }
        }
        
        for (let i = numbers.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
        }
        
        return numbers;
    }

    generateTarget(numbers) {
        const operations = ['+', '-', '*', '/'];
        const numOperations = Math.floor(Math.random() * 4) + 2;
        const targetRange = { min: 50, max: 999 };
        
        let available = [...numbers];
        let operationsMade = 0;
        let maxAttempts = 50;
        let attempts = 0;
        let operationWeights = ['+', '+', '-', '*', '*', '*', '/'];
        
        while (operationsMade < numOperations && available.length >= 2 && attempts < maxAttempts) {
            attempts++;
            
            const idx1 = Math.floor(Math.random() * available.length);
            let idx2;
            do {
                idx2 = Math.floor(Math.random() * available.length);
            } while (idx2 === idx1);
            
            const num1 = available[idx1];
            const num2 = available[idx2];
            const op = operationWeights[Math.floor(Math.random() * operationWeights.length)];
            
            let result;
            let validOperation = true;
            
            switch(op) {
                case '+':
                    result = num1 + num2;
                    break;
                case '-':
                    result = num1 - num2;
                    if (result <= 0) {
                        validOperation = false;
                    }
                    break;
                case '*':
                    result = num1 * num2;
                    if (result > 2000) {
                        validOperation = false;
                    }
                    break;
                case '/':
                    if (num2 === 0 || num1 % num2 !== 0 || num1 / num2 < 1) {
                        validOperation = false;
                    } else {
                        result = Math.floor(num1 / num2);
                    }
                    break;
            }
            
            if (validOperation) {
                const toRemove = [idx1, idx2].sort((a, b) => b - a);
                toRemove.forEach(idx => available.splice(idx, 1));
                available.push(result);
                operationsMade++;
                
                if (operationsMade >= 2) {
                    operationWeights = ['+', '+', '+', '-', '-', '*', '/'];
                }
            }
        }
        
        if (operationsMade >= numOperations && available.length > 0) {
            let targetCandidates = available.filter(num => 
                !numbers.includes(num) && 
                num >= targetRange.min && 
                num <= targetRange.max
            );
            
            if (targetCandidates.length === 0) {
                targetCandidates = available.filter(num => !numbers.includes(num) && num > 20);
            }
            
            if (targetCandidates.length === 0) {
                return { target: 0, success: false };
            }
            
            const targetIndex = Math.floor(Math.random() * targetCandidates.length);
            return { target: targetCandidates[targetIndex], success: true };
        }
        
        return { target: 0, success: false };
    }

    attachEventListeners() {
        document.getElementById('themeBtn').addEventListener('click', () => this.toggleTheme());
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('giveUpBtn').addEventListener('click', () => this.showSolution());
        
        document.getElementById('continueBtn').addEventListener('click', () => {
            document.getElementById('victoryModal').classList.remove('show');
            
            const allCompleted = this.games.every(g => g.completed);
            
            if (allCompleted) {
                this.currentGameIndex = 0;
                localStorage.removeItem('additionalGames');
                localStorage.removeItem('additionalCurrentGame');
                this.initializeGames();
                this.saveGames();
                this.renderGamesBar();
                this.loadGame(0);
                this.render();
            } else {
                const nextGame = this.games.findIndex((g, idx) => !g.completed && idx > this.currentGameIndex);
                if (nextGame !== -1) {
                    this.loadGame(nextGame);
                } else {
                    const firstIncomplete = this.games.findIndex(g => !g.completed);
                    if (firstIncomplete !== -1) {
                        this.loadGame(firstIncomplete);
                    } else {
                        this.loadGame(0);
                    }
                }
            }
        });
        
        document.getElementById('statsBtn').addEventListener('click', () => {
            this.showStats();
            document.getElementById('statsModal').classList.add('show');
        });
        
        document.getElementById('rulesBtn').addEventListener('click', () => {
            document.getElementById('rulesModal').classList.add('show');
        });
        
        document.getElementById('aboutBtn').addEventListener('click', () => {
            document.getElementById('aboutModal').classList.add('show');
        });
        
        document.getElementById('closeStats').addEventListener('click', () => {
            document.getElementById('statsModal').classList.remove('show');
        });
        
        document.getElementById('closeRules').addEventListener('click', () => {
            document.getElementById('rulesModal').classList.remove('show');
        });
        
        document.getElementById('closeAbout').addEventListener('click', () => {
            document.getElementById('aboutModal').classList.remove('show');
        });
        
        document.getElementById('closeSolutionBanner').addEventListener('click', () => {
            document.getElementById('solutionBanner').classList.remove('show');
        });
        
        document.getElementById('giveUpConfirmBtn').addEventListener('click', () => {
            this.handleGiveUpConfirmation();
        });
        
        document.getElementById('giveUpCancelBtn').addEventListener('click', () => {
            document.getElementById('giveUpModal').classList.remove('show');
            this.giveUpConfirmationLevel = 0;
        });
        
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    if (modal.id === 'giveUpModal') {
                        this.giveUpConfirmationLevel = 0;
                    }
                }
            });
        });
    }

    showStats() {
        const completed = this.games.filter(g => g.completed).length;
        const totalMoves = this.games.reduce((sum, g) => sum + g.moves, 0);
        const avgMoves = completed > 0 ? Math.round(totalMoves / completed) : 0;
        
        document.getElementById('completedCount').textContent = completed;
        document.getElementById('totalMoves').textContent = totalMoves;
        document.getElementById('avgMoves').textContent = avgMoves;
    }

    render() {
        const game = this.getCurrentGame();
        document.getElementById('targetNumber').textContent = game.target;

        const numbersGrid = document.getElementById('numbersGrid');
        numbersGrid.innerHTML = '';
        game.availableNumbers.forEach((num, index) => {
            if (num === null) {
                const btn = document.createElement('button');
                btn.className = 'number-btn';
                btn.textContent = '';
                btn.disabled = true;
                btn.style.opacity = '0';
                btn.style.cursor = 'default';
                numbersGrid.appendChild(btn);
                return;
            }
            
            const btn = document.createElement('button');
            btn.className = 'number-btn';
            btn.textContent = num;
            
            const isSelected = this.selectedNumber !== null && this.selectedNumber.index === index;
            
            if (this.selectedNumber !== null && this.selectedOperation !== null) {
                if (isSelected) {
                    btn.disabled = true;
                } 
                else if (!this.isOperationValid(this.selectedNumber.value, num, this.selectedOperation)) {
                    btn.disabled = true;
                }
            }
            
            if (isSelected) {
                btn.classList.add('selected');
            }
            
            btn.addEventListener('click', () => this.selectNumber(index));
            numbersGrid.appendChild(btn);
        });

        const operationBtns = document.querySelectorAll('.operation-btn:not(.undo-btn-op)');
        operationBtns.forEach(btn => {
            const op = btn.dataset.op;
            btn.disabled = this.selectedNumber === null;
            btn.classList.toggle('selected', this.selectedOperation === op);
            btn.onclick = () => this.selectOperation(op);
        });

        document.getElementById('undoBtn').disabled = game.history.length === 0;
    }

    selectNumber(index) {
        const game = this.getCurrentGame();
        const num = game.availableNumbers[index];

        if (num === null) return;

        if (this.selectedNumber === null) {
            this.selectedNumber = { index, value: num };
        } else if (this.selectedOperation !== null) {
            if (index === this.selectedNumber.index) return;
            
            if (this.isOperationValid(this.selectedNumber.value, num, this.selectedOperation)) {
                this.performOperation(num, index);
            }
        } else {
            if (this.selectedNumber.index === index) {
                this.selectedNumber = null;
            } else {
                this.selectedNumber = { index, value: num };
            }
        }

        this.render();
    }

    isOperationValid(num1, num2, op) {
        let result;
        
        switch(op) {
            case '+':
                return true;
            case '-':
                result = num1 - num2;
                return result > 0;
            case '*':
                return true;
            case '/':
                if (num2 === 0 || num1 % num2 !== 0) {
                    return false;
                }
                return true;
        }
        
        return false;
    }

    selectOperation(op) {
        if (this.selectedNumber === null) return;
        
        if (this.selectedOperation === op) {
            this.selectedOperation = null;
            this.render();
            return;
        }
        
        this.selectedOperation = op;
        this.render();
    }

    performOperation(secondNum, secondIndex) {
        const game = this.getCurrentGame();
        const firstNum = this.selectedNumber.value;
        const firstIndex = this.selectedNumber.index;
        const op = this.selectedOperation;
        let result;
        let opSymbol = op;

        switch(op) {
            case '+':
                result = firstNum + secondNum;
                break;
            case '-':
                result = firstNum - secondNum;
                break;
            case '*':
                result = firstNum * secondNum;
                opSymbol = '×';
                break;
            case '/':
                result = Math.floor(firstNum / secondNum);
                opSymbol = '÷';
                break;
        }

        game.history.push({
            numbers: [...game.availableNumbers],
            operation: `${firstNum} ${opSymbol} ${secondNum} = ${result}`
        });

        const newNumbers = [...game.availableNumbers];
        newNumbers[secondIndex] = result;
        newNumbers[firstIndex] = null;
        
        game.availableNumbers = newNumbers;
        game.moves++;
        this.selectedNumber = null;
        this.selectedOperation = null;
        this.saveGames();
        this.render();

        setTimeout(() => {
            if (game.availableNumbers.some(num => num === game.target && num !== null)) {
                this.showVictory();
            }
        }, 300);
    }

    undo() {
        const game = this.getCurrentGame();
        if (game.history.length === 0) return;

        const lastState = game.history.pop();
        game.availableNumbers = lastState.numbers;
        game.moves = Math.max(0, game.moves - 1);
        this.selectedNumber = null;
        this.selectedOperation = null;
        this.saveGames();
        this.render();
    }

    showVictory() {
        const game = this.getCurrentGame();
        game.completed = true;
        game.stars = 3;
        this.giveUpConfirmationLevel = 0;
        
        const allCompleted = this.games.every(g => g.completed);
        const modal = document.getElementById('victoryModal');
        const modalContent = modal.querySelector('.modal-content');
        
        if (allCompleted) {
            modalContent.querySelector('h2').textContent = '🎊 ¡Todos completados!';
            modalContent.querySelector('p').textContent = '¡Has completado todos los puzzles del día!';
            document.getElementById('continueBtn').textContent = 'Nuevos Puzzles';
        } else {
            modalContent.querySelector('h2').textContent = '🎉 ¡Felicidades!';
            modalContent.querySelector('p').textContent = '¡Has completado este puzzle!';
            document.getElementById('continueBtn').textContent = 'Continuar';
        }
        
        document.getElementById('movesCount').textContent = game.moves;
        modal.classList.add('show');
        this.saveGames();
        this.renderGamesBar();
    }

    showSolution() {
        const banner = document.getElementById('solutionBanner');
        const game = this.getCurrentGame();
        
        if (banner.classList.contains('show')) {
            banner.classList.remove('show');
            return;
        }
        
        if (game.giveUpConfirmed) {
            this.displaySolution();
        } else {
            this.showGiveUpConfirmation();
        }
    }
    
    showGiveUpConfirmation() {
        const modal = document.getElementById('giveUpModal');
        const title = document.getElementById('giveUpTitle');
        const message = document.getElementById('giveUpMessage');
        const confirmBtn = document.getElementById('giveUpConfirmBtn');
        const cancelBtn = document.getElementById('giveUpCancelBtn');
        
        const confirmations = [
            {
                emoji: '',
                title: '¿Rendirse?',
                message: '¿Estás seguro de que quieres ver la solución? Aún puedes resolverlo por tu cuenta.',
                confirmText: 'Sí, quiero ver la solución',
                cancelText: 'No, seguiré intentando'
            },
            {
                emoji: '',
                title: '¿De verdad te rindes?',
                message: 'Piénsalo bien... Una vez que veas la solución, la satisfacción de resolverlo tú mismo desaparecerá para siempre.',
                confirmText: 'Estoy seguro',
                cancelText: 'Tienes razón, lo intentaré'
            },
            {
                emoji: '',
                title: '¿Realmente vas a rendirte?',
                message: 'Has llegado hasta aquí... ¿No crees que mereces darte una oportunidad más? Los mejores logros vienen después del esfuerzo.',
                confirmText: 'Ya no puedo más',
                cancelText: 'Ok, un intento más'
            },
            {
                emoji: '',
                title: 'Última oportunidad...',
                message: 'Está bien, te mostraré la solución. Pero recuerda: la verdadera victoria está en el proceso, no en el resultado final. ¿Seguro que quieres continuar?',
                confirmText: 'Mostrar solución',
                cancelText: '¡No! Voy a lograrlo'
            }
        ];
        
        const currentConfirmation = confirmations[this.giveUpConfirmationLevel];
        
        title.textContent = `${currentConfirmation.emoji} ${currentConfirmation.title}`;
        message.textContent = currentConfirmation.message;
        confirmBtn.textContent = currentConfirmation.confirmText;
        cancelBtn.textContent = currentConfirmation.cancelText;
        
        modal.classList.add('show');
    }
    
    handleGiveUpConfirmation() {
        this.giveUpConfirmationLevel++;
        
        if (this.giveUpConfirmationLevel >= 4) {
            const game = this.getCurrentGame();
            game.giveUpConfirmed = true;
            this.saveGames();
            
            document.getElementById('giveUpModal').classList.remove('show');
            this.displaySolution();
            this.giveUpConfirmationLevel = 0;
        } else {
            document.getElementById('giveUpModal').classList.remove('show');
            setTimeout(() => this.showGiveUpConfirmation(), 150);
        }
    }
    
    displaySolution() {
        const game = this.getCurrentGame();
        const solution = this.findSolution(game.numbers, game.target);
        
        const stepsDiv = document.getElementById('solutionSteps');
        stepsDiv.innerHTML = '';
        
        if (solution && solution.length > 0) {
            solution.forEach((step, index) => {
                const stepDiv = document.createElement('div');
                stepDiv.className = 'solution-step';
                stepDiv.textContent = `${index + 1}. ${step}`;
                stepsDiv.appendChild(stepDiv);
            });
        } else {
            stepsDiv.innerHTML = '<p style="padding: 10px;">No se pudo encontrar una solución automática para este puzzle.</p>';
        }
        
        document.getElementById('solutionBanner').classList.add('show');
    }

    findSolution(numbers, target) {
        const solutions = [];
        
        const solve = (available, steps) => {
            if (available.includes(target)) {
                return steps;
            }
            
            if (available.length === 1) {
                return null;
            }
            
            for (let i = 0; i < available.length; i++) {
                for (let j = i + 1; j < available.length; j++) {
                    const a = available[i];
                    const b = available[j];
                    const operations = [
                        { op: '+', result: a + b, symbol: '+' },
                        { op: '-', result: a - b, symbol: '−' },
                        { op: '-', result: b - a, symbol: '−' },
                        { op: '*', result: a * b, symbol: '×' },
                    ];
                    
                    if (b !== 0 && a % b === 0) {
                        operations.push({ op: '/', result: a / b, symbol: '÷' });
                    }
                    if (a !== 0 && b % a === 0) {
                        operations.push({ op: '/', result: b / a, symbol: '÷' });
                    }
                    
                    for (const { result, symbol } of operations) {
                        if (result > 0 && Number.isInteger(result)) {
                            const newAvailable = available.filter((_, idx) => idx !== i && idx !== j);
                            newAvailable.push(result);
                            
                            const stepText = symbol === '−' && b > a 
                                ? `${b} ${symbol} ${a} = ${result}`
                                : symbol === '÷' && b > a
                                ? `${b} ${symbol} ${a} = ${result}`
                                : `${a} ${symbol} ${b} = ${result}`;
                            
                            const solution = solve(newAvailable, [...steps, stepText]);
                            if (solution) return solution;
                        }
                    }
                }
            }
            
            return null;
        };
        
        return solve([...numbers], []);
    }
}

const game = new NumberGame();
