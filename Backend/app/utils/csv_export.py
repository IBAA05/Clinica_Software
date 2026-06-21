"""CSV + Excel export helpers."""
from __future__ import annotations

import csv
import io
from typing import Iterable, Sequence

from openpyxl import Workbook


def rows_to_csv(headers: Sequence[str], rows: Iterable[Sequence]) -> bytes:
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(headers)
    for row in rows:
        writer.writerow(list(row))
    return buf.getvalue().encode("utf-8")


def rows_to_xlsx(headers: Sequence[str], rows: Iterable[Sequence], sheet_name: str = "Report") -> bytes:
    wb = Workbook()
    ws = wb.active
    ws.title = sheet_name[:31]
    ws.append(list(headers))
    for row in rows:
        ws.append([str(c) if c is not None else "" for c in row])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()
