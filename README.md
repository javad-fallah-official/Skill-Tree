# Django Skill Tree Application

A comprehensive web-based skill tree system built with Django, featuring an interactive visual interface for managing user skills and progression.

## 🌟 Features

### Core Functionality
- **Interactive Skill Tree Visualization** - Dynamic canvas-based skill tree with nodes and connections
- **User Authentication** - Complete registration and login system
- **Skill Management** - Unlock skills with prerequisite validation
- **Skill Points System** - Earn and spend skill points to unlock abilities
- **Category Organization** - Skills organized into logical categories
- **Real-time Updates** - Dynamic UI updates without page refresh

### User Interface
- **Pan & Zoom Controls** - Navigate large skill trees with mouse controls
- **Mouse Wheel Zoom** - Smooth zooming with scroll wheel
- **Drag Panning** - Click and drag to pan around the skill tree
- **Skill Information Panel** - Detailed skill descriptions and requirements
- **Visual Feedback** - Clear indicators for locked, unlocked, and available skills
- **Responsive Design** - Works on desktop and mobile devices

### Advanced Features
- **Prerequisite System** - Skills can require other skills to be unlocked first
- **Tier-based Organization** - Skills organized in progressive tiers
- **Admin Interface** - Django admin for managing skills and categories
- **Skill Reset Functionality** - Reset all skills and refund points
- **AJAX-powered Interactions** - Smooth user experience without page reloads

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Django 5.2+
- Modern web browser with JavaScript enabled

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/javad-fallah-official/Skill-Tree.git
   cd "Skill Tree"
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # Linux/Mac
   ```

3. **Install dependencies**
   ```bash
   pip install django
   ```

4. **Run migrations**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```

5. **Create superuser (optional)**
   ```bash
   python manage.py createsuperuser
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

7. **Access the application**
   - Main application: http://localhost:8000/skills/
   - Admin interface: http://localhost:8000/admin/

## 📁 Project Structure

```
Skill Tree/
├── manage.py                 # Django management script
├── skill_tree_app/          # Main project settings
│   ├── __init__.py
│   ├── settings.py          # Django configuration
│   ├── urls.py              # Main URL routing
│   └── wsgi.py              # WSGI configuration
├── skills/                  # Skills application
│   ├── models.py            # Database models
│   ├── views.py             # View controllers
│   ├── urls.py              # URL routing
│   ├── admin.py             # Admin interface
│   ├── migrations/          # Database migrations
│   └── templatetags/        # Custom template filters
└── templates/               # HTML templates
    ├── skills/
    │   └── skill_tree.html  # Main skill tree interface
    └── registration/        # Authentication templates
        ├── login.html
        └── register.html
```

## 🗄️ Database Models

### SkillCategory
- **name**: Category name
- **description**: Category description
- **icon**: CSS class or icon identifier

### Skill
- **name**: Skill name
- **description**: Detailed skill description
- **category**: Foreign key to SkillCategory
- **cost**: Skill points required to unlock
- **prerequisites**: Many-to-many relationship to other skills
- **tier**: Skill tier/level for organization
- **position_x/y**: Visual positioning coordinates

### UserProfile
- **user**: One-to-one relationship with Django User
- **total_skill_points**: Total points earned
- **spent_skill_points**: Points already spent
- **available_skill_points**: Calculated property

### UserSkill
- **user**: Foreign key to User
- **skill**: Foreign key to Skill
- **unlocked**: Boolean unlock status
- **unlocked_at**: Timestamp of unlock

## 🎮 Usage Guide

### For Users
1. **Register/Login** - Create an account or log in
2. **Navigate the Tree** - Use mouse to pan and zoom around the skill tree
3. **View Skills** - Click on skill nodes to see details
4. **Unlock Skills** - Click "Unlock Skill" if you have enough points and prerequisites
5. **Track Progress** - Monitor your skill points and unlocked abilities

### For Administrators
1. **Access Admin Panel** - Go to `/admin/` and log in with superuser credentials
2. **Manage Categories** - Create and organize skill categories
3. **Add Skills** - Create new skills with descriptions, costs, and prerequisites
4. **Set Positions** - Configure visual positioning for the skill tree
5. **Manage Users** - Add skill points or reset user progress

## 🎨 User Interface Controls

### Navigation
- **Mouse Wheel**: Zoom in/out
- **Click + Drag**: Pan around the skill tree
- **Zoom Buttons**: Use +/- buttons for precise zoom control
- **Reset Button**: Return to default view

### Skill Interaction
- **Click Skill Node**: View skill details
- **Unlock Button**: Unlock skill (if requirements met)
- **Visual Indicators**:
  - 🔒 **Locked**: Red nodes (requirements not met)
  - ✅ **Available**: Green nodes (can be unlocked)
  - ⭐ **Unlocked**: Gold nodes (already unlocked)

## 🔧 API Endpoints

- `GET /skills/` - Main skill tree view
- `POST /skills/unlock/<skill_id>/` - Unlock a specific skill
- `POST /skills/add-points/` - Add skill points (admin)
- `POST /skills/reset/` - Reset all user skills
- `GET/POST /skills/register/` - User registration

## 🛠️ Development

### Adding New Skills
1. Use Django admin to create skills
2. Set appropriate prerequisites and costs
3. Position skills visually using x/y coordinates
4. Test unlock flow and prerequisites

### Customizing the Interface
- Modify `templates/skills/skill_tree.html` for UI changes
- Update CSS styles for visual customization
- Adjust JavaScript for interaction behavior

### Database Management
```bash
# Create new migrations after model changes
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Reset database (development only)
python manage.py flush
```

## 🐛 Troubleshooting

### Common Issues

**Skills not appearing**: Check that skills are properly assigned to categories and have valid positions.

**Unlock not working**: Verify user has sufficient skill points and all prerequisites are met.

**Panning/Zooming issues**: Ensure JavaScript is enabled and no console errors are present.

**Database errors**: Run migrations and check model relationships.

### Debug Mode
Set `DEBUG = True` in `settings.py` for detailed error messages during development.

## 📝 License

This project is open source. Feel free to modify and distribute according to your needs.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review Django documentation
- Create an issue in the repository

---

**Built with Django 5.2 and modern web technologies for an engaging skill progression experience.**
        
