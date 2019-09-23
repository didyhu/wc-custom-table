"use strict"

/**
 * @typedef CustomTable.Row
 * @property {Array<CustomTable.Cell>} cells
 * @property {any} rowData
 */
/**
 * @typedef CustomTable.Cell
 * @property {String} html
 * @property {String} name
 * @property {any} cellData
 */
/**
 * @typedef CustomTable.State
 * @property {CustomTable.Row} head
 * @property {Array<CustomTable.Row>} body
 * @property {Number} highlightRow
 */
/**
 * @class
 * @emits table-action event.detail=>{row, column, rowData, cellData} event.target=>cellElem
 * @emits table-over event.detail=>{row, column, rowData, cellData} event.target=>cellElem
 */
class CustomTable extends HTMLElement {
    static get layout() {
        return `<style>
                    :host{
                        position: relative;
                        display: block;
                    }
                    ::slotted([cell]){cursor: pointer;}
                    div{
                        overflow: auto; width: 100%; height:100%;
                        margin-top: 30px;
                    }
                    thead ::slotted([cell]){
                        position: absolute;
                        top: -30px;
                    }
                    table{
                        border-collapse: collapse;
                        width: 100%;
                    }
                    table thead td{
                        width: 10%;
                    }
                </style>
                <div>
                    <table>
                        <thead><tr></tr></thead>
                        <tbody><tr></tr></tbody>
                    </table>
                </div>`
    }
    constructor() {
        super()
        this.attachShadow({ mode: "open" })
        this.shadowRoot.innerHTML = this.constructor.layout
        this.thead = this.shadowRoot.querySelector("thead")
        this.tbody = this.shadowRoot.querySelector("tbody")
        this._state = {}
        this.shadowRoot.addEventListener("click", event => {
            const target = this._target(event.path)
            if (target) {
                const { rowData, cellData, column, row } = target
                const { name } = target.dataset
                target.dispatchEvent(new CustomEvent("table-action", { bubbles: true, detail: { rowData, cellData, column, row, name } }))
            }
        })
        this.addEventListener("mouseout", event => {
            const target = this._target(event.path)
            if (target) {
                const { column, row } = target
                const cells = Array.from(this.querySelectorAll("div[cell]"))
                for (const cell of cells) {
                    if (cell == target) {
                        cell.classList.remove("hover")
                    }
                    if (cell.row == row) {
                        cell.classList.remove("hover-row")
                    }
                    if (cell.column == column) {
                        cell.classList.remove("hover-column")
                    }
                }
            }
        })
        this.addEventListener("mouseover", event => {
            const target = this._target(event.path)
            if (target) {
                const { rowData, cellData, column, row } = target
                const { name } = target.dataset
                const cells = Array.from(this.querySelectorAll("div[cell]"))
                for (const cell of cells) {
                    if (cell == target) {
                        cell.classList.add("hover")
                    } else {
                        cell.classList.remove("hover")
                    }
                    if (cell.row == row) {
                        cell.classList.add("hover-row")
                    } else {
                        cell.classList.remove("hover-row")
                    }
                    if (cell.column == column) {
                        cell.classList.add("hover-column")
                    } else {
                        cell.classList.remove("hover-column")
                    }
                }
                target.dispatchEvent(new CustomEvent("table-over", { bubbles: true, detail: { rowData, cellData, column, row, name } }))
            }
        })
    }
    /**
     * @returns {CustomTable.State}
     */
    get state() {
        return this._state
    }
    /**
     * @param {CustomTable.State} state
     */
    set state(state) {
        const { head, body, highlightRow } = state
        if (head !== this._state.head) {
            this._updateRow(head, this.thead.querySelector("tr"), "head")
            this._state.head = head
        }
        if (body !== this._state.body) {
            this._state.body = body
            this._pair(body.length, this.tbody, () => {
                const tr = document.createElement("tr")
                return tr
            })
            const trElems = Array.from(this.tbody.querySelectorAll("tr"))
            for (let rowIndex = 0; rowIndex < body.length; rowIndex++) {
                const row = body[rowIndex]
                this._updateRow(row, trElems[rowIndex], rowIndex)
            }
        }
        if (highlightRow !== this._state.highlightRow) {
            this._state.highlightRow = highlightRow
            this._highlight(highlightRow)
        }
        setTimeout(() => {
            this.sweepUnusedCells()
        }, 1000)
    }
    sweepUnusedCells() {
        let rows = 0
        if (this._state.body) {
            rows = this._state.body.length
        }
        const cells = Array.from(this.querySelectorAll("div[cell]"))
        for (const cell of cells) {
            if (cell.row == "head" && !this._state.head) {
                cell.remove()
            } else if (Number.parseInt(cell.row) >= rows) {
                cell.remove()
            }
        }
    }
    _highlight(row) {
        const cells = Array.from(this.querySelectorAll("div[cell]"))
        for (const cell of cells) {
            if (cell.row == row) {
                cell.classList.add("highlight")
            } else {
                cell.classList.remove("highlight")
            }
        }
    }
    _target(path) {
        const results = []
        for (const elem of path) {
            if (elem == this) {
                break
            }
            results.push(elem)
        }
        const cell = results.find(elem => elem.hasAttribute && elem.hasAttribute("cell"))
        return cell
    }
    _createRow(rowIndex) {
        const tr = document.createElement("tr")
        tr.setAttribute("row", rowIndex)
        return tr
    }
    _createCell(rowIndex, columnIndex) {
        const td = document.createElement("td")
        td.innerHTML = `<slot name="${rowIndex}-${columnIndex}"></slot>`
        td.setAttribute("row", rowIndex)
        td.setAttribute("cell", columnIndex)
        td.style.padding = 0
        return td
    }
    _updateRow(tableRow, trElem, rowIndex) {
        const cells = new Map()
        if (tableRow && tableRow.cells) {
            tableRow.cells.forEach((tableCell, columnIndex) => {
                const pos = `${rowIndex}-${columnIndex}`
                const id = `cell-${pos}`
                let elem = this.querySelector(`#${id}`)
                if (!elem) {
                    elem = document.createElement("div")
                    elem.setAttribute("id", id)
                    elem.setAttribute("slot", pos)
                    elem.setAttribute("cell", "")
                    elem.row = rowIndex
                    elem.column = columnIndex
                    if (elem.row == "head") {
                        elem.classList.add("head-cell")
                    } else {
                        elem.classList.add("body-cell")
                    }
                    if (columnIndex % 2 == 0) {
                        elem.classList.add("even-column")
                    } else {
                        elem.classList.remove("even-column")
                    }
                    if (rowIndex % 2 == 0) {
                        elem.classList.add("even-row")
                    } else {
                        elem.classList.remove("even-row")
                    }
                    this.appendChild(elem)
                }
                elem.cellData = tableCell.cellData
                elem.rowData = tableRow.rowData
                elem.innerHTML = tableCell.html
                if (tableCell.name) {
                    elem.dataset.name = tableCell.name
                } else {
                    delete elem.dataset.name
                }
                cells.set(pos, { data: tableCell.data, elem: elem })
            })
        }
        this._pair(cells.size, trElem, (columnIndex) => this._createCell(rowIndex, columnIndex))
    }
    _pair(size, parentElem, createElem) {
        const elems = Array.from(parentElem.children)
        let results
        const dif = elems.length - size
        if (dif > 0) {
            results = []
            for (let i = 0; i < elems.length; i++) {
                if (i < size) {
                    results.push(elems[i])
                } else {
                    elems[i].remove()
                }
            }
        } else if (dif < 0) {
            results = Array.from(elems)
            for (let i = 0; i < -dif; i++) {
                const index = i + elems.length
                const elem = createElem(index)
                parentElem.appendChild(elem)
                results.push(elem)
            }
        }
        return results
    }
}

export { CustomTable }