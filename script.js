const storageKey = "promptsStorage";

const state = {
	prompts: [],
	selectedId: null,
}

const elements = {
	promptTitle: document.getElementById('prompt-title'),
	promptContent: document.getElementById('prompt-content'),
	titleWrapper: document.getElementById('title-wrapper'),
	contentWrapper: document.getElementById('content-wrapper'),
    btnOpen: document.getElementById('btn-open'),
	btnSave: document.getElementById('btn-save'),
    btnCollapse: document.getElementById('btn-collapse'),
	bntNew: document.getElementById('btn-new'),
    sidebar: document.querySelector('.sidebar'),
	list: document.getElementById('prompt-list'),
	search: document.getElementById('search-input'),
};

// Atualiza o estado do wrapper conforme o conteúdo do elemento
function updateEditableWrapperState(element, wrapper) {
	const hasText = element.textContent.trim().length > 0;
    wrapper.classList.toggle('is-empty', !hasText)
}

// Atualiza o estado de todos os elementos editáveis
function updateAllEditableSltates() {
	updateEditableWrapperState(elements.promptTitle, elements.titleWrapper)
	updateEditableWrapperState(elements.promptContent, elements.contentWrapper)
}

// Adiciona ouvintes de evento input para atualizar wrappers em tempo real
function attachAllEditableHandlers() {
	elements.promptTitle.addEventListener('input', function() {
		updateEditableWrapperState(elements.promptTitle, elements.titleWrapper)
	})
	elements.promptContent.addEventListener('input', function() {
		updateEditableWrapperState(elements.promptContent, elements.contentWrapper)
	})
	// Atualiza o estado inicial
	updateAllEditableSltates()
}

// Função para abrir a sidebar
function openSidebar() {
	elements.sidebar.style.display = "flex";
	elements.btnOpen.style.display = "none";
}

// Função para fechar a sidebar
function closeSidebar() {
	elements.sidebar.style.display = "none";
    elements.btnOpen.style.display = "block";
}
function save() {
	const title = elements.promptTitle.textContent.trim()
	const content = elements.promptContent.innerHTML.trim()
	const hasContent = elements.promptContent.textContent.trim()

	if (!title|| !hasContent) {
		alert("Por favor, preencha o título e o conteúdo do prompt antes de salvar.")
		return
	}

	if(state.selectedId) {
		const existingPrompt = state.prompts.find((p) => p.id === state.selectedId)
		if(existingPrompt) {
			existingPrompt.title = title || "Sem título"
			existingPrompt.content = content || "Sem conteúdo"
		}
	} else {
		const newPrompt = {
			id: Date.now().toString(36),
			title,
			content,
		}
		state.prompts.unshift(newPrompt)
		state.selectedId = newPrompt.id
	}

	renderList(elements.search.value)
	persist()
	alert("Prompt salvo com sucesso!")
}

function persist() {
	try {
		localStorage.setItem(storageKey, JSON.stringify(state.prompts))
	} catch (error) {
		console.log("Erro ao salvar no localStorage:", error)
	}
}
function load() {
	try {
		const storage = localStorage.getItem(storageKey)
		state.prompts = storage ? JSON.parse(storage) : []
		state.selectedId = null
	} catch (error) {
		console.log("Erro ao carregar do localStorage:", error)
	}
}

function createPromptItem(prompt) {
	return `
			<li class="prompt-item" data-id="${prompt.id}" data-action="select">
            	<div class="prompt-item-content">
                    <span class="prompt-item-title">${prompt.title}</span>
                    <span class="prompt-item-description">${prompt.content}</span>
                </div>

             	<button class="btn-icon" title="Remover" data-action="remove">
                	<img src="assets/remove.svg" alt="Remover" class="icon icon-trash" />
            	</button>
            </li>
			`
}

function renderList(filterText = "") {
	const filteredPrompt = state.prompts
	.filter((prompt) =>
		prompt.title.toLowerCase().includes(filterText.toLowerCase().trim())
)
	.map((p) => createPromptItem(p))
	.join("")
	elements.list.innerHTML = filteredPrompt
}

function newPrompt() {
	state.selectedId = null
	elements.promptTitle.textContent = ""
	elements.promptContent.textContent = ""
	updateAllEditableSltates()
	elements.promptTitle.focus()
}

												//Evento ==> Filtrar lista ==> Remover item
elements.btnSave.addEventListener("click", save);
elements.bntNew.addEventListener("click", newPrompt); 

elements.search.addEventListener("input", function (event) {
	renderList(event.target.value)
})

elements.list.addEventListener("click", function (event) {
	const removeBtn = event.target.closest("[data-action='remove']")
	const item = event.target.closest("[data-id]")

	if (!item) return

	const id = item.getAttribute("data-id")

	if(removeBtn) {
		//Remove item
		state.prompts = state.prompts.filter((p) => p.id !== id)
		renderList(elements.search.value)
		persist()
		return
	}

	if(event.target.closest("[data-action='select']")) {
		const prompt = state.prompts.find((p) => p.id === id)
	
		if(prompt) {
		elements.promptTitle.textContent = prompt.title
		elements.promptContent.textContent = prompt.content
		updateAllEditableSltates()
		}
	}
})

	// Função de inicialização
function init() {
	load()
	renderList("")
	attachAllEditableHandlers()
	updateAllEditableSltates()
	// Estado inicial: sidebar visível, botão open oculto
	elements.sidebar.style.display = '';
	elements.btnOpen.style.display = 'none';

	// Adiciona eventos para abrir/fechar sidebar
	elements.btnOpen.addEventListener('click', openSidebar)
	elements.btnCollapse.addEventListener('click', closeSidebar)
}

// Executa a inicialização
init();
