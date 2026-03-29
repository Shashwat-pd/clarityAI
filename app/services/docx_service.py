import io
import json
import zipfile
from xml.sax.saxutils import escape


class DOCXService:
    CONTENT_TYPES_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>
"""

    ROOT_RELS_XML = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"""

    def render(self, brief) -> bytes:
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            archive.writestr("[Content_Types].xml", self.CONTENT_TYPES_XML)
            archive.writestr("_rels/.rels", self.ROOT_RELS_XML)
            archive.writestr("word/document.xml", self._build_document_xml(brief))
        return buffer.getvalue()

    def _build_document_xml(self, brief) -> str:
        body_parts = [
            self._paragraph("Counselor Brief", bold=True, size=32),
            self._paragraph(f"Generated: {brief.generated_at.strftime('%Y-%m-%d %H:%M UTC')}", size=20),
        ]

        if brief.period_start or brief.period_end:
            start = brief.period_start.strftime("%Y-%m-%d") if brief.period_start else "N/A"
            end = brief.period_end.strftime("%Y-%m-%d") if brief.period_end else "N/A"
            body_parts.append(self._paragraph(f"Period: {start} to {end}", size=20))
        body_parts.append(self._paragraph(f"Sessions included: {brief.session_count or 0}", size=20))
        body_parts.append(self._paragraph(""))

        for section_name, section_value in brief.content.items():
            body_parts.append(self._paragraph(self._humanize_key(section_name), bold=True, size=26))
            body_parts.extend(self._render_section_value(section_value))
            body_parts.append(self._paragraph(""))

        body_parts.append(self._section_properties())

        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:wpc="http://schemas.microsoft.com/office/word/2010/wordprocessingCanvas" '
            'xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006" '
            'xmlns:o="urn:schemas-microsoft-com:office:office" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
            'xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math" '
            'xmlns:v="urn:schemas-microsoft-com:vml" '
            'xmlns:wp14="http://schemas.microsoft.com/office/word/2010/wordprocessingDrawing" '
            'xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" '
            'xmlns:w10="urn:schemas-microsoft-com:office:word" '
            'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" '
            'xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml" '
            'xmlns:wpg="http://schemas.microsoft.com/office/word/2010/wordprocessingGroup" '
            'xmlns:wpi="http://schemas.microsoft.com/office/word/2010/wordprocessingInk" '
            'xmlns:wne="http://schemas.microsoft.com/office/word/2006/wordml" '
            'xmlns:wps="http://schemas.microsoft.com/office/word/2010/wordprocessingShape" '
            'mc:Ignorable="w14 wp14"><w:body>'
            + "".join(body_parts)
            + "</w:body></w:document>"
        )

    def _render_section_value(self, value) -> list[str]:
        parsed = self._maybe_parse_json(value)
        if isinstance(parsed, list):
            return [self._bullet(str(item)) for item in parsed]
        if isinstance(parsed, dict):
            lines = []
            for key, item in parsed.items():
                lines.append(self._paragraph(f"{self._humanize_key(str(key))}:", bold=True, size=22))
                lines.extend(self._render_section_value(item))
            return lines
        text = str(parsed).strip() if parsed is not None else ""
        if not text:
            return [self._paragraph("No content available.", size=20)]
        return [self._paragraph(line, size=22) for line in text.splitlines() if line.strip()]

    def _maybe_parse_json(self, value):
        if not isinstance(value, str):
            return value
        stripped = value.strip()
        if not stripped:
            return value
        if stripped.startswith("[") or stripped.startswith("{"):
            try:
                return json.loads(stripped)
            except json.JSONDecodeError:
                return value
        return value

    def _humanize_key(self, key: str) -> str:
        return key.replace("_", " ").strip().title()

    def _paragraph(self, text: str, bold: bool = False, size: int = 22) -> str:
        text = escape(text)
        run_props = "<w:rPr>"
        if bold:
            run_props += "<w:b/>"
        run_props += f'<w:sz w:val="{size}"/><w:szCs w:val="{size}"/></w:rPr>'
        if not text:
            return "<w:p/>"
        return f"<w:p><w:r>{run_props}<w:t xml:space=\"preserve\">{text}</w:t></w:r></w:p>"

    def _bullet(self, text: str) -> str:
        return self._paragraph(f"- {text}", size=22)

    def _section_properties(self) -> str:
        return (
            "<w:sectPr>"
            "<w:pgSz w:w=\"12240\" w:h=\"15840\"/>"
            "<w:pgMar w:top=\"1440\" w:right=\"1440\" w:bottom=\"1440\" w:left=\"1440\" "
            "w:header=\"708\" w:footer=\"708\" w:gutter=\"0\"/>"
            "</w:sectPr>"
        )
