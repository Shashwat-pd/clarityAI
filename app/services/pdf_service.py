from weasyprint import HTML
from jinja2 import Environment, FileSystemLoader


class PDFService:
    def __init__(self, template_dir: str = "templates"):
        self.jinja_env = Environment(loader=FileSystemLoader(template_dir))

    def render(self, brief) -> bytes:
        template = self.jinja_env.get_template("brief_template.html")
        html_str = template.render(brief=brief)
        return HTML(string=html_str).write_pdf()
