from django import template

register = template.Library()

@register.filter
def mul(value, arg):
    """Multiplies the value by the argument."""
    try:
        return int(value) * int(arg)
    except (ValueError, TypeError):
        return 0

@register.filter
def div(value, arg):
    """Divides the value by the argument."""
    try:
        return int(value) // int(arg)
    except (ValueError, TypeError, ZeroDivisionError):
        return 0

@register.filter
def mod(value, arg):
    """Returns the remainder of value divided by argument."""
    try:
        return int(value) % int(arg)
    except (ValueError, TypeError, ZeroDivisionError):
        return 0