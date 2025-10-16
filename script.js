const storageKey = "promptsStorage";

const state = {
	prompts: [],
	selectedId: null,
	idToRemove: null,
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
	btnCopy: document.getElementById('btn-copy'),
    sidebar: document.querySelector('.sidebar'),
	list: document.getElementById('prompt-list'),
	search: document.getElementById('search-input'),
	modal: document.getElementById('confirmation-modal'),
    btnConfirmRemove: document.getElementById('btn-confirm-remove'),
    btnCancelRemove: document.getElementById('btn-cancel-remove'),
};

// Atualiza o estado do wrapper conforme o conteúdo do elemento
function updateEditableWrapperState(element, wrapper) {
	const hasText = element.textContent.trim().length > 0;
    wrapper.classList.toggle('is-empty', !hasText)
}

// Função para abrir a sidebar
function openSidebar() {
	elements.sidebar.classList.add("open")
	elements.sidebar.classList.remove("collapsed")
	elements.sidebar.style.display = "flex";
	elements.btnOpen.style.display = "none";
}

// Função para fechar a sidebar
function closeSidebar() {
	elements.sidebar.classList.remove("open")
	elements.sidebar.classList.add("collapsed")
	elements.sidebar.style.display = "none";
	elements.btnOpen.style.display = "block";
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

function showTemporaryFeedback(button, originalText, feedbackText) {
    const span = button.querySelector('span');
    if (span) {
        span.textContent = feedbackText;
    } else {
        button.textContent = feedbackText;
    }
    setTimeout(() => {
        if (span) {
            span.textContent = originalText;
        } else {
            button.textContent = originalText;
        }
    }, 1500); // 1.5 segundos
}
// Salva ou atualiza um prompt
function save() {
	const title = elements.promptTitle.textContent.trim()
	const content = elements.promptContent.innerHTML.trim()
	const hasContent = elements.promptContent.textContent.trim()

	if (!title|| !hasContent) {
		alert("O título e o conteúdo não podem estar vazios.")
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
	showTemporaryFeedback(elements.btnSave, "Salvar", "Salvo!");
	// alert("Prompt salvo com sucesso!")
}

function persist() {  // Salva os prompts no localStorage
	try {
		localStorage.setItem(storageKey, JSON.stringify(state.prompts))
	} catch (error) {
		console.log("Erro ao salvar no localStorage:", error)
	}
}

function load() { 	// Carrega os prompts do localStorage
	try {
		const storage = localStorage.getItem(storageKey)
		state.prompts = storage ? JSON.parse(storage) : []
		state.selectedId = null
	} catch (error) {
		console.log("Erro ao carregar do localStorage:", error)
	}
}
 	// Cria o HTML para um item de prompt
function createPromptItem(prompt) {
	const tmp = document.createElement("div")
	tmp.innerHTML = prompt.content                         // tmp recebe o conteúdo HTML do prompt (temporário)
	return `
			<li class="prompt-item" data-id="${prompt.id}" data-action="select">
            	<div class="prompt-item-content">
                    <span class="prompt-item-title">${prompt.title}</span>
                    <span class="prompt-item-description">${tmp.textContent}</span>
                </div>
				

             	<button class="btn-icon" title="Remover" data-action="remove">
                	<img src="assets/remove.svg" alt="Remover" class="icon icon-trash" />
            	</button>
            </li>
			`
}
// Renderiza a lista de prompts, aplicando um filtro se fornecido
function renderList(filterText = "") { // Renderiza a lista de prompts com filtro
	const filteredPrompt = state.prompts
	.filter((prompt) =>
		prompt.title.toLowerCase().includes(filterText.toLowerCase().trim())
)
	.map((p) => createPromptItem(p))
	.join("")
	elements.list.innerHTML = filteredPrompt
}

function newPrompt() {                     // Cria um novo prompt
	state.selectedId = null
	elements.promptTitle.textContent = ""
	elements.promptContent.textContent = ""
	updateAllEditableSltates()
	elements.promptTitle.focus()
}

function copySelected(){
	try {
		const content = elements.promptContent
		if (!navigator.clipboard) {
			console.error("A API Clipboard não é suportada neste navegador.")
			return
		}
		if (!content.innerText.trim()) {
			alert("O conteúdo está vazio. Nada para copiar.")
			return
		}

		navigator.clipboard.writeText(content.innerText)
		showTemporaryFeedback(elements.btnCopy, "Copiar", "Copiado!");
	} catch (error) {
		console.log("Erro ao copiar para a área de transferência:", error)
	}

}

//Evento ==> Filtrar lista ==> Remover item ==> copiar conteúdo
elements.btnSave.addEventListener("click", save);
elements.bntNew.addEventListener("click", newPrompt); 
elements.btnCopy.addEventListener("click", copySelected);
// Eventos da Modal
elements.btnConfirmRemove.addEventListener("click", removePromptConfirmed);
elements.btnCancelRemove.addEventListener("click", closeConfirmationModal);

elements.search.addEventListener("input", function (event) {
	renderList(event.target.value)
})

elements.list.addEventListener("click", function (event) {
	const removeBtn = event.target.closest("[data-action='remove']")
	const item = event.target.closest("[data-id]")

	if (!item) return   // Se não clicar em um item, sai da função
	
	const id = item.getAttribute("data-id")
	state.selectedId = id

	if(removeBtn) {
		// Substitui o confirm() nativo pela abertura da modal
        openConfirmationModal(id); 
		return
	}

	if(event.target.closest("[data-action='select']")) {  

		elements.list.querySelectorAll('.prompt-item').forEach(el => {
            el.classList.remove('selected');
        });
        item.classList.add('selected');	
		const prompt = state.prompts.find((p) => p.id === id)
	
		if(prompt) {
		elements.promptTitle.textContent = prompt.title
		elements.promptContent.innerHTML = prompt.content
		updateAllEditableSltates()
		}
		if (window.innerWidth <= 950) {
            closeSidebar();
        }
	}
})

function openConfirmationModal(id) {
    state.idToRemove = id;
    elements.modal.classList.add('is-visible');
}

function closeConfirmationModal() {
    state.idToRemove = null;
    elements.modal.classList.remove('is-visible');
}

// Função de remoção final (será chamada pelo botão 'Remover' da modal)
function removePromptConfirmed() {
    const id = state.idToRemove;
    if (!id) return; // Se não houver ID, saia

    // Lógica de remoção real (copiada da sua função de listener)
    state.prompts = state.prompts.filter((p) => p.id !== id);

    // Lógica para redefinir o editor se o item deletado for o selecionado
    if (state.selectedId === id) {
        newPrompt();
        if (state.prompts.length > 0) {
            state.selectedId = state.prompts[0].id;
        } else {
            state.selectedId = null;
        }
    }
    
    // Finaliza
    renderList(elements.search.value);
    persist();
    closeConfirmationModal(); // Fecha a modal após a remoção
}

	// Função de inicialização
function init() {
	load()
	renderList("")
	attachAllEditableHandlers()
	updateAllEditableSltates()
	// Estado inicial: sidebar visível, botão open oculto
	// elements.sidebar.style.display = '';
	// elements.btnOpen.style.display = 'none';

	elements.sidebar.classList.remove("open")
	elements.sidebar.classList.remove("collapsed")

	// Adiciona eventos para abrir/fechar sidebar
	elements.btnOpen.addEventListener('click', openSidebar)
	elements.btnCollapse.addEventListener('click', closeSidebar)
}


// Executa a inicialização
init();
