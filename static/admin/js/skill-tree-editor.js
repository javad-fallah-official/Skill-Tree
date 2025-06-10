// Skill Tree Editor JavaScript
class SkillTreeEditor {
    constructor() {
        this.selectedSkill = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.panOffset = { x: 0, y: 0 };
        this.isPanning = false;
        this.zoomLevel = 1;
        this.skillTooltip = null;
        this.gridVisible = false;
        this.hasDragged = false;
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        // Canvas events
        const editor = document.getElementById('skillTreeEditor');
        if (editor) {
            editor.addEventListener('click', (e) => this.handleCanvasClick(e));
            editor.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            editor.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            editor.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            editor.addEventListener('wheel', (e) => this.handleWheel(e));
        }
        
        // Search functionality
        const searchInput = document.getElementById('skillsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterSkills(e.target.value);
            });
        }
    }
    
    // Canvas interaction methods
    handleCanvasClick(e) {
        if (e.target.id === 'skillTreeEditor') {
            this.clearSelection();
        }
    }
    
    handleMouseDown(e) {
        if (e.target.classList.contains('skill-node')) {
            this.startDrag(e);
        } else {
            this.startPan(e);
        }
    }
    
    handleMouseMove(e) {
        if (this.isDragging) {
            this.drag(e);
        } else if (this.isPanning) {
            this.pan(e);
        }
    }
    
    handleMouseUp(e) {
        this.stopDrag();
        this.stopPan();
    }
    
    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.setZoom(this.zoomLevel + delta);
    }
    
    startDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const skillId = e.target.id.replace('skill-', '');
        this.selectedSkill = skillsData.find(s => s.id == skillId);
        this.isDragging = true;
        this.hasDragged = false;
        
        const node = e.target;
        node.classList.add('dragging');
        
        const rect = e.target.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        
        this.hideTooltip();
    }
    
    drag(e) {
        if (!this.isDragging || !this.selectedSkill) return;
        
        this.hasDragged = true;
        
        const editor = document.getElementById('skillTreeEditor');
        const rect = editor.getBoundingClientRect();
        
        const x = e.clientX - rect.left - this.dragOffset.x;
        const y = e.clientY - rect.top - this.dragOffset.y;
        
        const newX = x - 400;
        const newY = y - 400;
        
        this.selectedSkill.x = newX;
        this.selectedSkill.y = newY;
        
        const node = document.getElementById(`skill-${this.selectedSkill.id}`);
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        
        // Only update connections if this skill has prerequisites or dependents
        if (this.selectedSkill.prerequisites.length > 0 || this.hasSkillDependents(this.selectedSkill.id)) {
            this.renderConnections();
        }
    }
    
    stopDrag() {
        if (this.isDragging && this.selectedSkill) {
            const node = document.getElementById(`skill-${this.selectedSkill.id}`);
            if (node) {
                node.classList.remove('dragging');
            }
            
            // Update position in database
            this.updateSkillPositionInDB(this.selectedSkill.id, this.selectedSkill.x, this.selectedSkill.y);
            
            // Redraw connections with a small delay to ensure DOM is stable
            setTimeout(() => this.renderConnections(), 10);
        }
        
        // Reset dragging state with minimal delay
        setTimeout(() => {
            this.isDragging = false;
        }, 10);
    }
    
    startPan(e) {
        this.isPanning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
    }
    
    pan(e) {
        if (!this.isPanning) return;
        
        const deltaX = e.clientX - this.panStart.x;
        const deltaY = e.clientY - this.panStart.y;
        
        this.panOffset.x += deltaX;
        this.panOffset.y += deltaY;
        
        this.updateCanvasTransform();
        
        this.panStart = { x: e.clientX, y: e.clientY };
    }
    
    stopPan() {
        this.isPanning = false;
    }
    
    updateSkillPositionInDB(skillId, x, y) {
        fetch('/admin/skills/skill/update-skill-position/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify({
                skill_id: skillId,
                x: x,
                y: y
            })
        })
        .catch(error => {
            console.error('Error updating position:', error);
        });
    }
    
    // Skill management methods
    createSkill() {
        const formData = this.getFormData();
        if (!this.validateFormData(formData)) return;
        
        fetch('/admin/skills/skill/create-skill-ajax/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify(formData)
        })
        .then(response => {
            // Check if response is ok before parsing JSON
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Ensure prerequisites is an array
                if (!data.skill.prerequisites) {
                    data.skill.prerequisites = [];
                }
                skillsData.push(data.skill);
                this.refreshDisplay();
                this.clearForm();
                this.showNotification('Skill created successfully!', 'success');
            } else {
                this.showNotification('Error creating skill: ' + (data.error || 'Unknown error'), 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showNotification('Error creating skill: ' + error.message, 'error');
        });
    }
    
    updateSkill() {
        if (!this.selectedSkill) return;
        
        const formData = this.getFormData();
        if (!this.validateFormData(formData)) return;
        
        fetch(`/admin/skills/skill/update-skill-ajax/${this.selectedSkill.id}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': this.getCSRFToken()
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                Object.assign(this.selectedSkill, data.skill);
                this.refreshDisplay();
                this.showNotification('Skill updated successfully!', 'success');
            } else {
                this.showNotification('Error updating skill: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showNotification('Error updating skill', 'error');
        });
    }
    
    deleteSkill() {
        if (!this.selectedSkill) return;
        
        if (!confirm(`Are you sure you want to delete "${this.selectedSkill.name}"?`)) {
            return;
        }
        
        fetch(`/admin/skills/skill/delete-skill-ajax/${this.selectedSkill.id}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': this.getCSRFToken()
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                skillsData = skillsData.filter(s => s.id !== this.selectedSkill.id);
                this.refreshDisplay();
                this.clearForm();
                this.showNotification('Skill deleted successfully!', 'success');
            } else {
                this.showNotification('Error deleting skill: ' + data.error, 'error');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            this.showNotification('Error deleting skill', 'error');
        });
    }
    
    // UI helper methods
    refreshDisplay() {
        this.renderSkills();
        setTimeout(() => {
            this.renderConnections();
        }, 10);
        this.updateSkillsList();
        this.updateStatistics();
        this.populatePrerequisites();
    }
    
    renderSkills() {
        const editor = document.getElementById('skillTreeEditor');
        if (!editor) return;
        
        // Clear existing nodes
        editor.querySelectorAll('.skill-node').forEach(node => node.remove());
        
        skillsData.forEach(skill => {
            const node = this.createSkillNode(skill);
            editor.appendChild(node);
        });
    }
    
    createSkillNode(skill) {
        const node = document.createElement('div');
        node.className = 'skill-node';
        node.id = `skill-${skill.id}`;
        node.textContent = skill.name;
        node.style.left = `${skill.x + 400}px`;
        node.style.top = `${skill.y + 400}px`;
        
        // Add event listeners
        node.addEventListener('click', (e) => this.selectSkill(skill, e));
        node.addEventListener('mouseenter', (e) => this.showTooltip(skill, e));
        node.addEventListener('mouseleave', () => this.hideTooltip());
        
        return node;
    }
    
    renderConnections() {
        const editor = document.getElementById('skillTreeEditor');
        if (!editor) return;
        
        // Clear existing connections
        editor.querySelectorAll('.connection-line').forEach(line => line.remove());
        
        // Draw connections
        skillsData.forEach(skill => {
            skill.prerequisites.forEach(prereqId => {
                const prereqSkill = skillsData.find(s => s.id === prereqId);
                if (prereqSkill) {
                    this.drawConnection(prereqSkill, skill);
                }
            });
        });
    }
    
    drawConnection(from, to) {
        const editor = document.getElementById('skillTreeEditor');
        const line = document.createElement('div');
        line.className = 'connection-line';
        
        const fromX = from.x + 400 + 30; // Center of node
        const fromY = from.y + 400 + 30;
        const toX = to.x + 400 + 30;
        const toY = to.y + 400 + 30;
        
        const length = Math.sqrt(Math.pow(toX - fromX, 2) + Math.pow(toY - fromY, 2));
        const angle = Math.atan2(toY - fromY, toX - fromX) * 180 / Math.PI;
        
        line.style.left = `${fromX}px`;
        line.style.top = `${fromY}px`;
        line.style.width = `${length}px`;
        line.style.transform = `rotate(${angle}deg)`;
        
        editor.appendChild(line);
    }
    
    selectSkill(skill, event) {
        event.stopPropagation();
        
        // Remove previous selection
        document.querySelectorAll('.skill-node').forEach(node => {
            node.classList.remove('selected');
        });
        
        // Add selection to current skill
        document.getElementById(`skill-${skill.id}`).classList.add('selected');
        
        this.selectedSkill = skill;
        this.populateForm(skill);
        this.highlightInList(skill.id);
    }
    
    populateForm(skill) {
        document.getElementById('skillName').value = skill.name;
        document.getElementById('skillDescription').value = skill.description;
        document.getElementById('skillCategory').value = skill.category_id;
        document.getElementById('skillCost').value = skill.cost;
        document.getElementById('skillTier').value = skill.tier;
        
        // Set prerequisites
        const prereqSelect = document.getElementById('skillPrerequisites');
        Array.from(prereqSelect.options).forEach(option => {
            option.selected = skill.prerequisites.includes(parseInt(option.value));
        });
        
        // Show update/delete buttons, hide create button
        document.getElementById('createBtn').style.display = 'none';
        document.getElementById('updateBtn').style.display = 'inline-block';
        document.getElementById('deleteBtn').style.display = 'inline-block';
    }
    
    clearSelection() {
        document.querySelectorAll('.skill-node').forEach(node => {
            node.classList.remove('selected');
        });
        
        this.selectedSkill = null;
        this.clearForm();
    }
    
    clearForm() {
        document.getElementById('skillName').value = '';
        document.getElementById('skillDescription').value = '';
        document.getElementById('skillCost').value = '1';
        document.getElementById('skillTier').value = '1';
        
        // Clear prerequisites selection
        const prereqSelect = document.getElementById('skillPrerequisites');
        Array.from(prereqSelect.options).forEach(option => {
            option.selected = false;
        });
        
        // Show create button, hide update/delete buttons
        document.getElementById('createBtn').style.display = 'inline-block';
        document.getElementById('updateBtn').style.display = 'none';
        document.getElementById('deleteBtn').style.display = 'none';
        
        this.selectedSkill = null;
        
        // Remove selection
        document.querySelectorAll('.skill-node').forEach(node => {
            node.classList.remove('selected');
        });
    }
    
    populatePrerequisites() {
        const prereqSelect = document.getElementById('skillPrerequisites');
        if (!prereqSelect) return;
        
        prereqSelect.innerHTML = '';
        
        skillsData.forEach(skill => {
            const option = document.createElement('option');
            option.value = skill.id;
            option.textContent = skill.name;
            prereqSelect.appendChild(option);
        });
    }
    
    updateSkillsList() {
        const container = document.getElementById('skillsListContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        skillsData.forEach(skill => {
            const item = document.createElement('div');
            item.className = 'skill-list-item';
            item.innerHTML = `
                <div class="skill-item-name">${skill.name}</div>
                <div class="skill-item-meta">
                    <span>Tier ${skill.tier}</span>
                    <span>Cost ${skill.cost}</span>
                </div>
            `;
            
            item.addEventListener('click', () => {
                this.selectSkill(skill, { stopPropagation: () => {} });
            });
            
            container.appendChild(item);
        });
    }
    
    updateStatistics() {
        document.getElementById('totalSkills').textContent = skillsData.length;
        
        const maxTier = skillsData.length > 0 ? Math.max(...skillsData.map(s => s.tier)) : 1;
        document.getElementById('maxTier').textContent = maxTier;
        
        const totalConnections = skillsData.reduce((sum, skill) => sum + skill.prerequisites.length, 0);
        document.getElementById('totalConnections').textContent = totalConnections;
    }
    
    filterSkills(searchTerm) {
        const items = document.querySelectorAll('.skill-list-item');
        items.forEach(item => {
            const name = item.querySelector('.skill-item-name').textContent.toLowerCase();
            if (name.includes(searchTerm.toLowerCase())) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }
    
    highlightInList(skillId) {
        document.querySelectorAll('.skill-list-item').forEach((item, index) => {
            if (skillsData[index] && skillsData[index].id === skillId) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }
    
    showTooltip(skill, event) {
        this.hideTooltip();
        
        const tooltip = document.getElementById('skillTooltip');
        if (!tooltip) return;
        
        tooltip.querySelector('.tooltip-title').textContent = skill.name;
        tooltip.querySelector('.tooltip-description').textContent = skill.description;
        tooltip.querySelector('.tooltip-cost').textContent = `Cost: ${skill.cost}`;
        tooltip.querySelector('.tooltip-tier').textContent = `Tier: ${skill.tier}`;
        
        tooltip.style.display = 'block';
        tooltip.style.left = event.pageX + 10 + 'px';
        tooltip.style.top = event.pageY + 10 + 'px';
        
        this.skillTooltip = tooltip;
    }
    
    hideTooltip() {
        if (this.skillTooltip) {
            this.skillTooltip.style.display = 'none';
            this.skillTooltip = null;
        }
    }
    
    // Zoom and view controls
    setZoom(newZoom) {
        this.zoomLevel = Math.max(0.5, Math.min(2, newZoom));
        this.updateCanvasTransform();
        
        const zoomDisplay = document.getElementById('zoomLevel');
        if (zoomDisplay) {
            zoomDisplay.textContent = Math.round(this.zoomLevel * 100) + '%';
        }
    }
    
    updateCanvasTransform() {
        const editor = document.getElementById('skillTreeEditor');
        if (editor) {
            editor.style.transform = `scale(${this.zoomLevel}) translate(${this.panOffset.x}px, ${this.panOffset.y}px)`;
        }
    }
    
    toggleGrid() {
        this.gridVisible = !this.gridVisible;
        const grid = document.getElementById('gridOverlay');
        if (grid) {
            grid.classList.toggle('visible', this.gridVisible);
        }
    }
    
    autoArrangeSkills() {
        if (skillsData.length === 0) return;
        
        const nodeRadius = 40;
        const minDistance = nodeRadius * 2;
        
        // Simple grid arrangement
        const cols = Math.ceil(Math.sqrt(skillsData.length));
        const spacing = 120;
        
        skillsData.forEach((skill, index) => {
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            skill.x = (col - cols / 2) * spacing;
            skill.y = (row - Math.ceil(skillsData.length / cols) / 2) * spacing;
            
            // Update position in database
            this.updateSkillPositionInDB(skill.id, skill.x, skill.y);
        });
        
        this.refreshDisplay();
    }
    
    resetView() {
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.updateCanvasTransform();
        
        const zoomDisplay = document.getElementById('zoomLevel');
        if (zoomDisplay) {
            zoomDisplay.textContent = '100%';
        }
    }
    
    hasSkillDependents(skillId) {
        return skillsData.some(skill => skill.prerequisites.includes(skillId));
    }
    
    // Utility methods
    getFormData() {
        return {
            name: document.getElementById('skillName').value,
            description: document.getElementById('skillDescription').value,
            category_id: document.getElementById('skillCategory').value,
            cost: parseInt(document.getElementById('skillCost').value),
            tier: parseInt(document.getElementById('skillTier').value),
            prerequisites: Array.from(document.getElementById('skillPrerequisites').selectedOptions)
                .map(option => parseInt(option.value))
        };
    }
    
    validateFormData(data) {
        if (!data.name.trim()) {
            this.showNotification('Skill name is required', 'error');
            return false;
        }
        if (data.cost < 1) {
            this.showNotification('Cost must be at least 1', 'error');
            return false;
        }
        if (data.tier < 1) {
            this.showNotification('Tier must be at least 1', 'error');
            return false;
        }
        return true;
    }
    
    showNotification(message, type = 'info') {
        // Simple alert for now - you can enhance this later
        alert(message);
    }
    
    getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
}

// Global functions for backward compatibility
let skillTreeEditor;

function initializeSkillTreeEditor() {
    skillTreeEditor = new SkillTreeEditor();
    skillTreeEditor.refreshDisplay();
}

function createSkill() {
    skillTreeEditor.createSkill();
}

function updateSkill() {
    skillTreeEditor.updateSkill();
}

function deleteSkill() {
    skillTreeEditor.deleteSkill();
}

function clearForm() {
    skillTreeEditor.clearForm();
}

function autoArrangeSkills() {
    skillTreeEditor.autoArrangeSkills();
}

function resetView() {
    skillTreeEditor.resetView();
}

function toggleGrid() {
    skillTreeEditor.toggleGrid();
}

function zoomIn() {
    skillTreeEditor.setZoom(skillTreeEditor.zoomLevel + 0.1);
}

function zoomOut() {
    skillTreeEditor.setZoom(skillTreeEditor.zoomLevel - 0.1);
}
// Remove this duplicate function:
// hasSkillDependents(skillId) {
//     return skillsData.some(skill => skill.prerequisites.includes(skillId));
// }