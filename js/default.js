// 空白のテンプレートの概要については、次のドキュメントを参照してください:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    WinJS.Binding.optimizeBindingReferences = true;

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    var board;
    var pieceSize = [
        [2, 2],
        [1, 2],
        [1, 2],
        [1, 2],
        [1, 2],
        [2, 1],
        [1, 1],
        [1, 1],
        [1, 1],
        [1, 1],
    ];
    var movingPieceIds = {};
    var resetBoard = function () {
        board = [
            [1, 0],
            [0, 0],
            [3, 0],
            [0, 2],
            [3, 2],
            [1, 2],
            [1, 3],
            [2, 3],
            [0, 4],
            [3, 4],
        ];
    }
    var getPieceId = function (x, y) {
        for (var id = 0; id < board.length; ++id) {
            var px = x - 2 - 100 * board[id][0];
            var py = y - 2 - 100 * board[id][1];
            if (0 <= px && px < 100 * pieceSize[id][0] && 0 <= py && py < 100 * pieceSize[id][1]) {
                return id;
            }
        }
        return null;
    }
    var isEmpty = function (x, y) {
        if (!(0 <= x && x < 4 && 0 <= y && y < 5)) return false;
        for (var id = 0; id < board.length; ++id) {
            var px = x - board[id][0];
            var py = y - board[id][1];
            if (0 <= px && px < pieceSize[id][0] && 0 <= py && py < pieceSize[id][1]) {
                return false;
            }
        }
        return true;
    }
    var getPosition = function (pieceId, dx, dy) {
        var x = board[pieceId][0];
        var y = board[pieceId][1];
        var px = x * 100 + 2;
        var py = y * 100 + 2;
        var mx = 0;
        var my = 0;
        if (dx > 0 && -dx <= dy && dy <= dx) {
            var f = true;
            for (var i = 0; i < pieceSize[pieceId][1]; ++i) {
                f = f && isEmpty(x + pieceSize[pieceId][0], y + i);
            }
            if (f) {
                px += dx;
                if (dx >= 50) {
                    mx = 100;
                    board[pieceId][0] += 1;
                }
            }
        } else if (dy > 0 && -dy <= dx && dx <= dy) {
            var f = true;
            for (var i = 0; i < pieceSize[pieceId][0]; ++i) {
                f = f && isEmpty(x + i, y + pieceSize[pieceId][1]);
            }
            if (f) {
                py += dy;
                if (dy >= 50) {
                    my = 100;
                    board[pieceId][1] += 1;
                }
            }
        } else if (dx < 0 && dx <= dy && dy <= -dx) {
            var f = true;
            for (var i = 0; i < pieceSize[pieceId][1]; ++i) {
                f = f && isEmpty(x - 1, y + i);
            }
            if (f) {
                px += dx;
                if (dx <= -50) {
                    mx = -100;
                    board[pieceId][0] -= 1;
                }
            }
        } else if (dy < 0 && dy <= dx && dy <= -dx) {
            var f = true;
            for (var i = 0; i < pieceSize[pieceId][0]; ++i) {
                f = f && isEmpty(x + i, y - 1);
            }
            if (f) {
                py += dy;
                if (dy <= -50) {
                    my = -100;
                    board[pieceId][1] -= 1;
                }
            }
        }
        return {
            x: px,
            y: py,
            dx: mx,
            dy: my,
        };
    }

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: このアプリケーションは新しく起動しました。ここでアプリケーションを
                // 初期化します。
                resetBoard();
            } else {
                // TODO: このアプリケーションは中断状態から再度アクティブ化されました。
                // ここでアプリケーションの状態を復元します。
            }
            args.setPromise(WinJS.UI.processAll().then(function () {
                var pointers = {};
                document.body.addEventListener("pointerdown", function (event) {
                    var pieceId = getPieceId(event.x, event.y);
                    if (pieceId != null && !(pieceId in movingPieceIds)) {
                        pointers[event.pointerId] = {
                            movingPieceId: pieceId,
                            downX: event.x,
                            downY: event.y,
                        };
                        movingPieceIds[pieceId] = true;
                    }
                }, false);
                document.body.addEventListener("pointerup", function (event) {
                    if (event.pointerId in pointers) {
                        var pointer = pointers[event.pointerId];
                        var position = getPosition(pointer.movingPieceId, 0, 0);
                        var piece = document.getElementById("piece" + pointer.movingPieceId);
                        piece.style.left = position.x + "px";
                        piece.style.top = position.y + "px";
                        delete movingPieceIds[pointer.movingPieceId];
                        delete pointers[event.pointerId];
                    }
                }, false);
                document.body.addEventListener("pointermove", function (event) {
                    if (event.pointerId in pointers) {
                        var pointer = pointers[event.pointerId];
                        var dx = event.x - pointer.downX;
                        var dy = event.y - pointer.downY;
                        var position = getPosition(pointer.movingPieceId, dx, dy);
                        var piece = document.getElementById("piece" + pointer.movingPieceId);
                        piece.style.left = position.x + "px";
                        piece.style.top = position.y + "px";
                        pointer.downX += position.dx;
                        pointer.downY += position.dy;
                    }
                }, false);
            }));
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: このアプリケーションは中断しようとしています。ここで中断中に
        // 維持する必要のある状態を保存します。中断中に自動的に保存され、
        // 復元される WinJS.Application.sessionState オブジェクトを使用
        // できます。アプリケーションを中断する前に非同期操作を完了する
        // 必要がある場合は、args.setPromise() を呼び出して
        // ください。
    };

    app.start();
})();
