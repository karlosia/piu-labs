const COLUMNS = [
    { id: 'todo', title: 'Do zrobienia' },
    { id: 'in-progress', title: 'W trakcie' },
    { id: 'done', title: 'Zrobione' }
];

const DEFAULT_TITLE = 'Nowa karta';
const DEFAULT_CONTENT = 'Wpisz treść karty...';

let state = loadState();

function generateUniqueId() {
    return 'card-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
}

function getRandomColor() {
    const colors = ['#e1f5fe', '#c8e6c9', '#fff9c4', '#f8bbd0', '#bbdefb', '#ffecb3', '#d1c4e9'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function saveState() {
    localStorage.setItem('kanbanState', JSON.stringify(state));
    updateCardCounts();
}

function loadState() {
    const savedState = localStorage.getItem('kanbanState');
    if (savedState) return JSON.parse(savedState);
    const newState = {};
    COLUMNS.forEach(col => newState[col.id] = []);
    return newState;
}

function updateCardCounts() {
    COLUMNS.forEach(col => {
        const countElement = document.querySelector(`#${col.id} .card-count`);
        if (countElement) countElement.textContent = `Liczba kart: ${state[col.id].length}`;
    });
}

function handleFocus(event) {
    const element = event.target;
    const isTitle = element.classList.contains('card-title');
    const defaultValue = isTitle ? DEFAULT_TITLE : DEFAULT_CONTENT;
    if (element.textContent.trim() === defaultValue) {
        element.textContent = '';
    }
}

function createCardElement(card, columnId) {
    const cardElement = document.createElement('div');
    cardElement.classList.add('card');
    cardElement.dataset.id = card.id;

    const cardColor = card.color || getRandomColor();
    cardElement.style.backgroundColor = cardColor;
    cardElement.style.borderLeftColor = cardColor;
    
    card.color = cardColor; 

    const isFirstColumn = columnId === COLUMNS[0].id;
    const isLastColumn = columnId === COLUMNS[COLUMNS.length - 1].id;

    const moveLeftButton = `<button class="move-btn move-left" data-id="${card.id}" ${isFirstColumn ? 'style="display: none;"' : ''}>←</button>`;
    const moveRightButton = `<button class="move-btn move-right" data-id="${card.id}" ${isLastColumn ? 'style="display: none;"' : ''}>→</button>`;

    cardElement.innerHTML = `
        <button class="delete-card" data-id="${card.id}">✖</button>
        <div class="card-title" contenteditable="true" data-id="${card.id}">${card.title || DEFAULT_TITLE}</div>
        <div class="card-content" contenteditable="true" data-id="${card.id}">${card.content || DEFAULT_CONTENT}</div>
        <div class="card-actions">
            <input type="color" class="color-picker" data-id="${card.id}" value="${cardColor}">
            <div class="move-buttons">
                ${moveLeftButton}
                ${moveRightButton}
            </div>
        </div>
    `;

    cardElement.querySelector('.card-title').addEventListener('focus', handleFocus);
    cardElement.querySelector('.card-content').addEventListener('focus', handleFocus);
    cardElement.querySelector('.card-title').addEventListener('blur', handleEditCard);
    cardElement.querySelector('.card-content').addEventListener('blur', handleEditCard);
    
    cardElement.querySelector('.delete-card').addEventListener('click', handleDeleteCard);
    cardElement.querySelector('.color-picker').addEventListener('input', handleChangeCardColor);

    return cardElement;
}

function renderBoard() {
    const board = document.getElementById('kanban-board');
    board.innerHTML = '';

    COLUMNS.forEach(col => {
        const columnElement = document.createElement('div');
        columnElement.classList.add('column');
        columnElement.id = col.id;
        columnElement.innerHTML = `
            <h2>${col.title}</h2>
            <div class="column-options">
                <span class="card-count">Liczba kart: 0</span>
                <button class="add-card-btn" data-column-id="${col.id}">+ Dodaj kartę</button>
            </div>
            <div class="column-options">
                <button class="color-column-btn" data-column-id="${col.id}">Koloruj kolumnę</button>
                <button class="sort-btn" data-column-id="${col.id}">↕ Sortuj</button>
            </div>
            <div class="cards-container"></div>
        `;

        const cardsContainer = columnElement.querySelector('.cards-container');
        state[col.id].forEach(card => cardsContainer.appendChild(createCardElement(card, col.id)));

        board.appendChild(columnElement);

        columnElement.querySelector('.cards-container').addEventListener('click', handleMoveCard);
        columnElement.querySelector('.add-card-btn').addEventListener('click', handleAddCard);
        columnElement.querySelector('.color-column-btn').addEventListener('click', handleColorColumn);
        columnElement.querySelector('.sort-btn').addEventListener('click', handleSortColumn);
    });

    updateCardCounts();
}

function handleChangeCardColor(event) {
    const cardId = event.target.dataset.id;
    const newColor = event.target.value;
    const cardElement = event.target.closest('.card');

    cardElement.style.backgroundColor = newColor;
    cardElement.style.borderLeftColor = newColor;

    for (const columnId in state) {
        const cardIndex = state[columnId].findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            state[columnId][cardIndex].color = newColor;
            saveState();
            return;
        }
    }
}

function handleEditCard(event) {
    const cardId = event.target.dataset.id;
    const element = event.target;
    const isTitle = element.classList.contains('card-title');
    const defaultValue = isTitle ? DEFAULT_TITLE : DEFAULT_CONTENT;
    
    let newValue = element.textContent.trim();
    const finalValue = newValue || defaultValue;

    element.textContent = finalValue; 

    for (const columnId in state) {
        const cardIndex = state[columnId].findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            if (isTitle) state[columnId][cardIndex].title = finalValue;
            else state[columnId][cardIndex].content = finalValue;
            saveState();
            return;
        }
    }
}

function handleAddCard(event) {
    const columnId = event.target.dataset.columnId;
    const newCard = {
        id: generateUniqueId(),
        title: DEFAULT_TITLE,
        content: DEFAULT_CONTENT,
        color: getRandomColor() 
    };
    state[columnId].push(newCard);
    saveState();
    renderBoard();
}

function handleDeleteCard(event) {
    const cardId = event.target.dataset.id;
    if (!confirm('Czy na pewno chcesz usunąć tę kartę?')) return;

    for (const columnId in state) {
        const initialLength = state[columnId].length;
        state[columnId] = state[columnId].filter(card => card.id !== cardId);
        if (state[columnId].length < initialLength) {
            saveState();
            renderBoard();
            return;
        }
    }
}

function handleMoveCard(event) {
    if (!event.target.classList.contains('move-btn')) return;

    const cardId = event.target.dataset.id;
    const isMovingRight = event.target.classList.contains('move-right');
    const currentColumnId = event.currentTarget.parentElement.id;

    let cardToMove = null;
    const cardIndex = state[currentColumnId].findIndex(card => card.id === cardId);

    if (cardIndex !== -1) cardToMove = state[currentColumnId].splice(cardIndex, 1)[0];
    if (!cardToMove) return;

    const currentIndex = COLUMNS.findIndex(col => col.id === currentColumnId);
    const newIndex = currentIndex + (isMovingRight ? 1 : -1);

    if (newIndex >= 0 && newIndex < COLUMNS.length) {
        const newColumnId = COLUMNS[newIndex].id;
        state[newColumnId].push(cardToMove);
        saveState();
        renderBoard();
    } else {
        state[currentColumnId].splice(cardIndex, 0, cardToMove);
    }
}

function handleColorColumn(event) {
    const columnId = event.target.dataset.columnId;
    const newColor = getRandomColor();
    state[columnId].forEach(card => card.color = newColor);
    saveState();
    renderBoard();
}

function handleSortColumn(event) {
    const columnId = event.target.dataset.columnId;
    state[columnId].sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
    saveState();
    renderBoard();
}

document.addEventListener('DOMContentLoaded', renderBoard);