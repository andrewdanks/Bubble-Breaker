
/* The colors that are supported in the game. To add another, just add
X to the array below and add X.png to the images/ folder. */
colors = new Array('blue', 'green', 'purple', 'red', 'yellow');

time_elapsed = 0;
time_started = false;
game_over = false;
ROWS = 0;
COLS = 0;
SCORE = 0;
group = Array();
bubbles = Array();

/* Get the color of the bubble at col,row */
function get_color(col, row) {
    return bubbles[col][row];
}

function change_bubble_color(col, row, new_color) {
    old_color = get_color(col, row);
    if (old_color != null)
    remove_class(cell_key(get_cell(col, row)), old_color);
    if (new_color != null)
        add_class(cell_key(get_cell(col, row)), new_color);
    bubbles[col][row] = new_color;
}

function delete_bubble(col, row) {
    change_bubble_color(col, row, null);
}

/* this is where we magically move bubbles down */
function fill_empty_cells() {
    for (var g in group) {
        col = group[g]['col'];
        row = 0;
        while (has_free_cells(col)) {
            row = (row + 1) % ROWS;
            if (!empty_cell(col, row)) continue;
            for(var r = row-1; r > 0 && empty_cell(col, r); r--) { }
            change_bubble_color(col, row, get_color(col, r));
            change_bubble_color(col, r, null);
        }   
    }
}

/* return true if there are free cells in the given column.
free cells do not include ones at the top */
function has_free_cells(col) {
    for (var row = 1; row < ROWS; row++)
        if (empty_cell(col, row) && !empty_cell(col, row-1))
            return true;
    return false;
}

/* return true if the cell has no bubble in it */
function empty_cell(col, row) {
    clr = get_color(col, row);
    return clr == '' || clr == null;
}

/* Return an array of Cells of the same color next to (col,row) */
function neighbors(col, row) {
    ret = Array();

    if (empty_cell(col, row))
        return ret;
    
    CLR = get_color(col, row);

    if (col > 0 && (prev_col = get_left_col(col)) >= 0 && get_color(prev_col, row) == CLR) 
        ret.push(get_cell(prev_col, row));

    if (col+1 < COLS && (next_col = get_right_col(col)) && get_color(next_col, row) == CLR)
        ret.push(get_cell(next_col, row));

    if (row+1 < ROWS && get_color(col, row+1) == CLR)
        ret.push(get_cell(col, row+1));

    if (row > 0 && get_color(col, row-1) == CLR)
        ret.push(get_cell(col, row-1));

    return ret;
}

function get_left_col(col) {
    var c = col - 1;
    while (c-1 >= 0 && is_col_empty(c)) c--;
    return c;
}

function get_right_col(col) {
    var c = col + 1;
    while (c+1 < COLS && is_col_empty(c)) c++;
    return c;
}

/* return true if col is an empty column */
function is_col_empty(col) {
    return empty_cell(col, ROWS-1);
}

function cell_key(cell) {
    return 'cell' + cell['col'] + cell['row'];
}

/* BFS to find bubbles with the same colours */
function bfs_group(root_cell) {
    Q = Array();
    Q.push(root_cell);
    marked = {};
    while (Q.length > 0) {
        t = Q.pop();
        n = neighbors(t['col'], t['row']);
        for (var i = 0; i < n.length; i++) {
            cell = n[i];
            key = cell_key(cell);
            if (!(key in marked)) {
                marked[key] = cell;
                Q.push(cell);
            }
        }
    }
    return marked;
}

/* Highlight group of bubbles centered at col,row via BFS */
function highlight_group(col, row) {
    group = bfs_group(get_cell(col, row));

    var gcol, grow;
    for (var g in group) {
        cell_id = cell_key(group[g]);
        add_class(cell_id, 'group');

        gcol = group[g]['col'];
        grow = group[g]['row'];

        if (grow > 0 && (adj_cell_id = cell_key(get_cell(gcol, grow-1))) && adj_cell_id in group)
            add_class(cell_id, 'none_top');
        
        if (grow+1 < ROWS && (adj_cell_id = cell_key(get_cell(gcol, grow+1))) && adj_cell_id in group)
            add_class(cell_id, 'none_bottom');

        if (gcol > 0 && (left_col = get_left_col(gcol)) >= 0 && (adj_cell_id = cell_key(get_cell(left_col, grow))) && adj_cell_id in group)
            add_class(cell_id, 'none_left');

        if (gcol+1 < COLS && (right_col = get_right_col(gcol)) && (adj_cell_id = cell_key(get_cell(right_col, grow))) && adj_cell_id in group)
            add_class(cell_id, 'none_right');
    } 

}

/* check if there are any moves left to make */
function moves_left() {
    for (i = 0; i < COLS; i++)
        for (j = 0; j < ROWS; j++)
            if (neighbors(i, j).length > 0)
                return true;
    return false;
}

/* return an object representation of a cell */
function get_cell(col, row) {
    cell = {};
    cell['col'] = col;
    cell['row'] = row;
    return cell;
}

function unhighlight_group() { 
    for (var g in group) {
        remove_class(cell_key(group[g]), 'group');
        remove_class(cell_key(group[g]), 'none_top');
        remove_class(cell_key(group[g]), 'none_bottom');
        remove_class(cell_key(group[g]), 'none_left');
        remove_class(cell_key(group[g]), 'none_right');
    }
}

function bubble_clicked(col, row) {
    if (empty_cell(col, row))
        return;

    group_size = size(group);
    if (group_size > 0 && (cell_key(get_cell(col, row)) in group)) {
        // we clicked a bubble in a highlighted group, so delete them and add the points;
        update_score(group_size * group_size);
        for (var g in group)
            delete_bubble(group[g]['col'], group[g]['row']);
        fill_empty_cells();
        unhighlight_group();
        hide_empty_columns();
        group = {};
        load_html('to_add', '');
    } else if (group_size > 0) {
        // clicked a bubble outside of a highlighted group
        unhighlight_group();
        group = {};
        highlight_group(col, row);
    } else {
        highlight_group(col, row);
        new_group_size = size(group);
        potential_score = '<br>+' + new_group_size * new_group_size; 
        load_html('to_add', potential_score);
    }

    if (!moves_left()) {
        game_over = true;
        time_started = false;
        document.forms[0].score.value = SCORE;
        load_html('game_over_score', SCORE);
        remove_class('submit_score', 'hide');
        document.getElementById("name").focus();
    }
}

function update_score(add_score) {
    SCORE += add_score;
    load_html('score', SCORE);
}

function hide_empty_columns() {
    for (var g in group) {
        col = group[g]['col'];
        if (empty_cell(col, ROWS-1))
            add_class('col_'+col, 'hide');
    }
}

function generate_random_color() {
    var rand = Math.floor(Math.random()*colors.length)
    return color = colors[rand];
}

function create_board(cols, rows) {
    COLS = cols;
    ROWS = rows;
    content = '';
    for (col = 0; col < cols; col++) {
        bubbles[col] = Array();
        content += '<div class="col" id="col_'+col+'">';
        for (row = 0; row < rows; row++) {
            color = generate_random_color();
            bubbles[col][row] = color;
            div_id = cell_key(get_cell(col, row));
            content += '<div id="'+div_id+'" class="bubble '+color+' row_'+row+'" onclick="bubble_clicked('+col+','+row+')"></div>';
        }
        content += '</div>';
    }
    load_html('bubble_breaker', content);
}

function restart_time() {
    time_elapsed = 0;
    if (!time_started)
        update_time();
    time_started = true;
}

function update_time() {
    if (game_over) return;
    secs = Math.round(time_elapsed / 100) / 10; // round to 1 dec place
    if (secs % 1 == 0) secs = secs + ".0";
    load_html('time_elapsed', secs);
    time_elapsed += 100;
    setTimeout("update_time()", 100);
}

function new_game() {
    game_over = false;
    create_board(15, 8);
    SCORE = 0;
    load_html('score', SCORE);
    remove_class('score_box', 'hide');
    add_class('submit_score', 'hide');
    restart_time();
}

function size(obj) {
    var c = 0;
    for (o in obj) c++;
    return c;
}

function add_class(object_id, class_name) {
    document.getElementById(object_id).classList.add(class_name);
}

function remove_class(object_id, class_name) {
    document.getElementById(object_id).classList.remove(class_name);
}

function load_html(object_id, html) {
    document.getElementById(object_id).innerHTML = html;
}
