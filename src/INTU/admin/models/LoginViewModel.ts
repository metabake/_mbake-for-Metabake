declare var depp: any;

depp.define({
    'services': [
        '/intuAPI/IntuAPI.js'
    ]
});

class LoginViewModel extends BaseViewModel {

    services: any;

    constructor(arg) {
        super()
        if (42 !== arg) throw new Error('use static inst()') // guard!
    }

    setup() {
        this.services = new IntuAPI();
    }

    static _instance: LoginViewModel
    static inst(): Promise<LoginViewModel> {
        return new Promise(function (res, rej) {

            if (LoginViewModel._instance) res(LoginViewModel._instance)

            depp.require(['httpRPC', 'services'], function () {
                LoginViewModel._instance = new LoginViewModel(42);
                LoginViewModel._instance.setup();
                res(LoginViewModel._instance);
            });
        });
    }

    checkAdmin(email, pass) {
        return this.services.checkAdmin(email, pass);
    }

    sendVcode(email, loginUrl) {
        return this.services.sendVcode(email, loginUrl);
    }

    resetPass(email, code, pass) {
        return this.services.resetPass(email, code, pass);
    }
}