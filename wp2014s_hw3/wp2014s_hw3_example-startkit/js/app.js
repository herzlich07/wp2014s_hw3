(function () {
    Parse.initialize("jAG2T0SQVmPfSEwSXob2oX2xgsQfXNWEQ323zapN", "da7KYqIhx5q3LR2W5UTAFlKQEBrns7ZKqdM5Tq8Z");
    var hw3template = {};
    ["loginView", "evaluationView", "updateSuccessView"].forEach(function (t) {
        templateCode = document.getElementById(t).text;
        hw3template[t] = doT.template(templateCode)
    });
    var homeView = {
        loginRequiredView: function (funtionView) {
            return function () {
                var currentUser = Parse.User.current();
                if (currentUser) {
                    funtionView()
                } else {
                    window.location.hash = "login/" + window.location.hash
                }
            }
        }
    };
    var hw3Handler = {
        navbar: function () {
            var currentuser = Parse.User.current();
            if (currentuser) {
                document.getElementById("loginButton").style.display = "none";
                document.getElementById("logoutButton").style.display = "block";
                document.getElementById("evaluationButton").style.display = "block"
            } else {
                document.getElementById("loginButton").style.display = "block";
                document.getElementById("logoutButton").style.display = "none";
                document.getElementById("evaluationButton").style.display = "none"
            }
            document.getElementById("logoutButton").addEventListener("click", function () {
                Parse.User.logOut();
                hw3Handler.navbar();
                window.location.hash = "login/"
            })
        },
        evaluationView: homeView.loginRequiredView(function () {
            var Evaluation = Parse.Object.extend("Evaluation");
            var currentUser = Parse.User.current();
            var studentACL = new Parse.ACL;
            studentACL.setPublicReadAccess(false);
            studentACL.setPublicWriteAccess(false);
            studentACL.setReadAccess(currentUser, true);
            studentACL.setWriteAccess(currentUser, true);
            var hw3Query = new Parse.Query(Evaluation);
            hw3Query.equalTo("user", currentUser);
            hw3Query.first({
                success: function (evaluation) {
                    window.EVAL = evaluation;
                    if (evaluation === undefined) {
                        var member = TAHelp.getMemberlistOf(currentUser.get("username")).filter(function (e) {
                            return e.StudentId !== currentUser.get("username") ? true : false
                        }).map(function (e) {
                            e.scores = ["0", "0", "0", "0"];
                            return e
                        }) 
                    } else {
                        var member = evaluation.toJSON().evaluations
                    }
                    document.getElementById("content").innerHTML = hw3template.evaluationView(member);
                    document.getElementById("evaluationForm-submit").value = evaluation === undefined ? "送出表單" : "修改表單";
                    document.getElementById("evaluationForm").addEventListener("submit", function () {
                        for (var i = 0; i < member.length; i++) {
                            for (var u = 0; u < member[i].scores.length; u++) {
                                var a = document.getElementById("stu" + member[i].StudentId + "-q" + u);
                                var score = a.options[a.selectedIndex].value;
                                member[i].scores[u] = score
                            }
                        }
                        if (evaluation === undefined) {
                            evaluation = new Evaluation;
                            evaluation.set("user", currentUser);
                            evaluation.setACL(studentACL)
                        }
                        console.log(member);
                        evaluation.set("evaluations", member);
                        evaluation.save(null, {
                            success: function () {
                                document.getElementById("content").innerHTML = hw3template.updateSuccessView()
                            },
                            error: function () {}
                        })
                    }, false)
                },
                error: function (object, err) {}
            })
        }),
        loginView: function (redirect) {
            var checkStudentID = function (DOM_ID) {
                    var studentID = document.getElementById(DOM_ID).value;
                    return TAHelp.getMemberlistOf(studentID) === false ? false : true
                };
            var showResponse = function (DOM_ID, fn, msg) {
                    if (!fn()) {
                        document.getElementById(DOM_ID).innerHTML = msg;
                        document.getElementById(DOM_ID).style.display = "block"
                    } else {
                        document.getElementById(DOM_ID).style.display = "none"
                    }
                };
            var postAction = function () {
                    hw3Handler.navbar();
                    window.location.hash = redirect ? redirect : ""
                };
            var password = function () {
                    var signup_password = document.getElementById("form-signup-password");
                    var signup_password1 = document.getElementById("form-signup-password1");
                    var password_value = signup_password.value === signup_password1.value ? true : false;
                    showResponse("form-signup-message", function () {
                        return password_value
                    }, "Passwords don't match.");
                    return password_value
                };
            document.getElementById("content").innerHTML = hw3template.loginView();
            document.getElementById("form-signin-student-id").addEventListener("keyup", function () {
                showResponse("form-signin-message", function () {
                    return checkStudentID("form-signin-student-id")
                }, "The student is not one of the class students.")
            });
            document.getElementById("form-signin").addEventListener("submit", function () {
                if (!checkStudentID("form-signin-student-id")) {
                    alert("The student is not one of the class students.");
                    return false
                }
                Parse.User.logIn(document.getElementById("form-signin-student-id").value, document.getElementById("form-signin-password").value, {
                    success: function (user) {
                        postAction()
                    },
                    error: function (user, error) {
                        showResponse("form-signin-message", function () {
                            return false
                        }, "Invaild username or password.")
                    }
                })
            }, false);
            document.getElementById("form-signup-student-id").addEventListener("keyup", function () {
                showResponse("form-signup-message", function () {
                    return checkStudentID("form-signup-student-id")
                }, "The student is not one of the class students.")
            });
            document.getElementById("form-signup-password1").addEventListener("keyup", password);
            document.getElementById("form-signup").addEventListener("submit", function () {
                if (!checkStudentID("form-signup-student-id")) {
                    alert("The student is not one of the class students.");
                    return false
                }
                var password_value = password();
                if (!password_value) {
                    return false
                }
                var user = new Parse.User;
                user.set("username", document.getElementById("form-signup-student-id").value);
                user.set("password", document.getElementById("form-signup-password").value);
                user.set("email", document.getElementById("form-signup-email").value);
                user.signUp(null, {
                    success: function (user) {
                        postAction()
                    },
                    error: function (user, error) {
                        showResponse("form-signup-message", function () {
                            return false
                        }, error.message)
                    }
                })
            }, false)
        }
    };
    var router = Parse.Router.extend({
        routes: {
            "": "indexView",
            "peer-evaluation/": "evaluationView",
            "login/*redirect": "loginView"
        },
        indexView: hw3Handler.evaluationView,
        evaluationView: hw3Handler.evaluationView,
        loginView: hw3Handler.loginView
    });
    this.Router = new router;
    Parse.history.start();
    hw3Handler.navbar()
})()