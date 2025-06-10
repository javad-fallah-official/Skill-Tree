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
        
        this.initializeEventListeners();
    }
    
    initializeEventListeners() {
        const editor = document.getElementById('skillTreeEditor');
        if (editor) {
            editor.addEventListener('click', (e) => this.handleCanvasClick(e));
            editor.addEventListener('mousedown', (e) => this.handleMouseDown(e));
            editor.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            editor.addEventListener('mouseup', (e) => this.handleMouseUp(e));
            editor.addEventListener('wheel', (e) => this.handleWheel(e));
        }
        
        const searchInput = document.getElementById('skillsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterSkills(e.target.value);
            });
        }
    }
    
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
        e.stopPropagation();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        this.setZoom(this.zoomLevel + delta);
    }
    
    startDrag(e) {
        e.preventDefault();
        e.stopPropagation();
        
        const skillId = e.target.id.replace('skill-', '');
        this.selectedSkill = skillsData.find(s => s.id == skillId);
        this.isDragging = true;
        
        const node = e.target;
        node.classList.add('dragging');
        
        const rect = e.target.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        
        this.hideTooltip();
    }
    
    drag(e) {
        if (!this.isDragging || !this.selectedSkill) return;
        
        const editor = document.getElementById('skillTreeEditor');
        const rect = editor.getBoundingClientRect();
        
        const x = e.clientX - rect.left - this.dragOffset.x;
        const y = e.clientY - rect.top - this.dragOffset.y;
        
        this.selectedSkill.x = x;
        this.selectedSkill.y = y;
        
        const node = document.getElementById(`skill-${this.selectedSkill.id}`);
        node.style.left = `${x}px`;
        node.style.top = `${y}px`;
        
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
            
            this.updateSkillPositionInDB(this.selectedSkill.id, this.selectedSkill.x, this.selectedSkill.y);
            setTimeout(() => this.renderConnections(), 10);
        }
        
        setTimeout(() => {
            this.isDragging = false;
        }, 10);
    }
    
    updateCanvasTransform() {
        const editor = document.getElementById('skillTreeEditor');
        if (editor) {
            editor.style.transform = `translate(${this.panOffset.x}px, ${this.panOffset.y}px) scale(${this.zoomLevel})`;
            editor.style.transformOrigin = '0 0';
        }
    }
    
    startPan(e) {
        if (e.target.classList.contains('skill-node')) return;
        
        this.isPanning = true;
        this.panStart = { x: e.clientX, y: e.clientY };
        
        const editor = document.getElementById('skillTreeEditor');
        if (editor) {
            editor.style.cursor = 'grabbing';
        }
    }
    
    pan(e) {
        if (!this.isPanning) return;
        
        const deltaX = (e.clientX - this.panStart.x) / this.zoomLevel;
        const deltaY = (e.clientY - this.panStart.y) / this.zoomLevel;
        
        this.panOffset.x += deltaX;
        this.panOffset.y += deltaY;
        
        this.updateCanvasTransform();
        
        this.panStart = { x: e.clientX, y: e.clientY };
    }
    
    stopPan() {
        if (this.isPanning) {
            this.isPanning = false;
            
            const editor = document.getElementById('skillTreeEditor');
            if (editor) {
                editor.style.cursor = 'grab';
            }
        }
    }
    
    centerViewOnSkills() {
        if (skillsData.length === 0) return;
        
        const bounds = {
            minX: Math.min(...skillsData.map(s => s.x)),
            maxX: Math.max(...skillsData.map(s => s.x)),
            minY: Math.min(...skillsData.map(s => s.y)),
            maxY: Math.max(...skillsData.map(s => s.y))
        };
        
        const centerX = (bounds.minX + bounds.maxX) / 2;
        const centerY = (bounds.minY + bounds.maxY) / 2;
        
        this.panOffset.x = -centerX;
        this.panOffset.y = -centerY;
        
        this.updateCanvasTransform();
    }
    
    resetView() {
        this.zoomLevel = 1;
        this.panOffset = { x: 0, y: 0 };
        this.updateCanvasTransform();
        
        const zoomDisplay = document.getElementById('zoomLevel');
        if (zoomDisplay) {
            zoomDisplay.textContent = '100%';
        }
        
        setTimeout(() => this.centerViewOnSkills(), 100);
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
            this.showNotification('Error updating position', 'error');
        });
    }
    
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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
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
            this.showNotification('Error deleting skill', 'error');
        });
    }
    
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
        node.style.left = `${skill.x}px`;
        node.style.top = `${skill.y}px`;
        
        node.addEventListener('click', (e) => this.selectSkill(skill, e));
        node.addEventListener('mouseenter', (e) => this.showTooltip(skill, e));
        node.addEventListener('mouseleave', () => this.hideTooltip());
        
        return node;
    }
    
    renderConnections() {
        const editor = document.getElementById('skillTreeEditor');
        if (!editor) return;
        
        editor.querySelectorAll('.connection-line').forEach(line => line.remove());
        
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
        
        const fromX = from.x + 30;
        const fromY = from.y + 30;
        const toX = to.x + 30;
        const toY = to.y + 30;
        
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
        
        document.querySelectorAll('.skill-node').forEach(node => {
            node.classList.remove('selected');
        });
        
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
        
        const prereqSelect = document.getElementById('skillPrerequisites');
        Array.from(prereqSelect.options).forEach(option => {
            option.selected = skill.prerequisites.includes(parseInt(option.value));
        });
        
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
        
        const prereqSelect = document.getElementById('skillPrerequisites');
        Array.from(prereqSelect.options).forEach(option => {
            option.selected = false;
        });
        
        document.getElementById('createBtn').style.display = 'inline-block';
        document.getElementById('updateBtn').style.display = 'none';
        document.getElementById('deleteBtn').style.display = 'none';
        
        this.selectedSkill = null;
        
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
    
    setZoom(newZoom) {
        this.zoomLevel = Math.max(0.5, Math.min(2, newZoom));
        this.updateCanvasTransform();
        
        const zoomDisplay = document.getElementById('zoomLevel');
        if (zoomDisplay) {
            zoomDisplay.textContent = Math.round(this.zoomLevel * 100) + '%';
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
        
        const rootNodes = skillsData.filter(skill => 
            !skill.prerequisites || skill.prerequisites.length === 0
        );
        
        const trees = rootNodes.map(root => this.buildSkillTree(root));
        
        const treeSpacing = 400;
        const levelSpacing = 180;
        const baseNodeSpacing = 100;
        
        let currentTreeX = 0;
        
        trees.forEach(tree => {
            const treeDepth = this.calculateTreeDepth(tree);
            const treeWidth = this.calculateTreeWidth(tree, baseNodeSpacing);
            const treeStartX = currentTreeX - treeWidth / 2;
            
            const rootY = (treeDepth - 1) * levelSpacing;
            
            this.positionTreeNodesOrganic(tree, treeStartX, rootY, -levelSpacing, baseNodeSpacing, 0);
            
            currentTreeX += treeWidth + treeSpacing;
        });
        
        skillsData.forEach(skill => {
            this.updateSkillPositionInDB(skill.id, skill.x, skill.y);
        });
        
        this.refreshDisplay();
    }
    
    buildSkillTree(rootSkill) {
        const visited = new Set();
        
        const buildNode = (skill, depth = 0) => {
            if (visited.has(skill.id)) return null;
            visited.add(skill.id);
            
            const children = skillsData.filter(s => 
                s.prerequisites && s.prerequisites.includes(skill.id)
            ).map(child => buildNode(child, depth + 1)).filter(Boolean);
            
            return {
                skill: skill,
                children: children,
                depth: depth
            };
        };
        
        return buildNode(rootSkill);
    }
    
    calculateTreeDepth(node) {
        if (!node || !node.children || node.children.length === 0) {
            return 1;
        }
        
        return 1 + Math.max(...node.children.map(child => this.calculateTreeDepth(child)));
    }
    
    calculateTreeWidth(node, baseSpacing) {
        if (!node || !node.children || node.children.length === 0) {
            return baseSpacing;
        }
        
        const depthMultiplier = 1 + (node.depth * 0.2);
        const childrenWidth = node.children.reduce((sum, child) => 
            sum + this.calculateTreeWidth(child, baseSpacing * depthMultiplier), 0
        );
        
        return Math.max(baseSpacing * depthMultiplier, childrenWidth);
    }
    
    positionTreeNodesOrganic(node, startX, startY, levelSpacing, nodeSpacing, parentX = null) {
        if (!node) return { width: 0, centerX: startX };
        
        const depthVariation = Math.sin(node.depth * 0.5) * 20;
        const organicSpacing = nodeSpacing * (1 + node.depth * 0.15);
        
        if (!node.children || node.children.length === 0) {
            const leafVariation = (Math.random() - 0.5) * 30;
            node.skill.x = startX + leafVariation;
            node.skill.y = startY + depthVariation;
            return { width: organicSpacing, centerX: startX };
        }
        
        let currentChildX = startX;
        const childResults = [];
        
        node.children.forEach((child, index) => {
            const branchOffset = (index - (node.children.length - 1) / 2) * 15;
            
            const result = this.positionTreeNodesOrganic(
                child, 
                currentChildX + branchOffset, 
                startY + levelSpacing, 
                levelSpacing, 
                organicSpacing,
                startX
            );
            childResults.push(result);
            currentChildX += result.width;
        });
        
        const totalWidth = childResults.reduce((sum, result) => sum + result.width, 0);
        let centerX;
        
        if (childResults.length > 0) {
            const leftmostChild = childResults[0].centerX;
            const rightmostChild = childResults[childResults.length - 1].centerX;
            centerX = (leftmostChild + rightmostChild) / 2;
        } else {
            centerX = startX;
        }
        
        if (parentX !== null) {
            const pullTowardParent = (parentX - centerX) * 0.1;
            centerX += pullTowardParent;
        }
        
        node.skill.x = centerX + depthVariation;
        node.skill.y = startY;
        
        return { width: totalWidth, centerX: centerX };
    }
    
    hasSkillDependents(skillId) {
        return skillsData.some(skill => skill.prerequisites.includes(skillId));
    }
    
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
        alert(message);
    }
    
    getCSRFToken() {
        return document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';
    }
}

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