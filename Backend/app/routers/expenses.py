from __future__ import annotations

import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, Response, status

from app.core.dependencies import CurrentUser, DbSession, require_doctor
from app.models.enums import ExpenseCategory
from app.schemas.expense import ExpenseCreate, ExpenseOut, ExpenseTotals, ExpenseUpdate
from app.services.expense_service import ExpenseService
from app.utils.csv_export import rows_to_csv
from app.utils.pagination import PageParams, pagination_params
from app.utils.response import make_pagination, success

# Entire expenses module is doctor-only
router = APIRouter(prefix="/expenses", tags=["Expenses"], dependencies=[Depends(require_doctor)])


@router.get("")
async def list_expenses(
    db: DbSession,
    page_params: PageParams = Depends(pagination_params),
    category: Optional[ExpenseCategory] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
):
    items, total, totals = await ExpenseService(db).list(
        offset=page_params.offset,
        limit=page_params.limit,
        category=category,
        date_from=date_from,
        date_to=date_to,
        search=search,
    )
    data = {
        "expenses": [ExpenseOut.model_validate(e) for e in items],
        "totals": ExpenseTotals(**totals),
    }
    return success(data, pagination=make_pagination(page_params.page, page_params.limit, total))


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_expense(payload: ExpenseCreate, current_user: CurrentUser, db: DbSession):
    expense = await ExpenseService(db).create(payload, current_user.id)
    await db.commit()
    return success(ExpenseOut.model_validate(expense), message="Expense created")


@router.get("/export")
async def export_expenses(
    db: DbSession,
    category: Optional[ExpenseCategory] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    search: Optional[str] = None,
):
    items = await ExpenseService(db).list_all(
        category=category, date_from=date_from, date_to=date_to, search=search
    )
    csv_bytes = rows_to_csv(
        ["Date", "Category", "Description", "Amount", "Receipt Ref", "Notes"],
        [
            [e.date, e.category.value, e.description, e.amount, e.receipt_ref, e.notes]
            for e in items
        ],
    )
    return Response(
        content=csv_bytes,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=expenses.csv"},
    )


@router.get("/{expense_id}")
async def get_expense(expense_id: uuid.UUID, db: DbSession):
    expense = await ExpenseService(db).get(expense_id)
    return success(ExpenseOut.model_validate(expense))


@router.put("/{expense_id}")
async def update_expense(expense_id: uuid.UUID, payload: ExpenseUpdate, db: DbSession):
    expense = await ExpenseService(db).update(expense_id, payload)
    await db.commit()
    return success(ExpenseOut.model_validate(expense), message="Expense updated")


@router.delete("/{expense_id}")
async def delete_expense(expense_id: uuid.UUID, db: DbSession):
    await ExpenseService(db).delete(expense_id)
    await db.commit()
    return success(None, message="Expense deleted")
