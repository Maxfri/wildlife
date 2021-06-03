import { DataBase } from '../../indexedDB';
import { Component, RootElement } from '../../app.api';
import './auth.scss';

export class Auth {
  private readonly page: HTMLElement;

  public iDB: DataBase;

  constructor(private readonly root: RootElement) {
    this.page = document.createElement('div');
  }

  render(): HTMLElement {
    this.page.classList.add('modal');
    this.page.innerHTML = `<div class="auth">
    <h2 class="auth-header">Registr new player</h2>
    <div class="auth-form auth-form">
      <div class="auth-form__areas">
        <div class="auth-form__area">
          <div class="auth-form__title">First Name</div>
          <input id="firstName" class="auth-form__value form__name" type="text" required >
          <label for="firstName" class="auth-form__message">The name can't contains only numbers or symbols </label>
        </div>
        <div class="auth-form__area">
          <div class="auth-form__title">Second Name</div>
          <input id="secondName" class="auth-form__value form__last-name" type="text" required >
          <label for="secondName" class="auth-form__message">
          The last name can't contains only numbers or symbols
          </label>
        </div>
        <div class="auth-form__area">
          <div class="auth-form__title">E-mail</div>
          <input id="email" class="auth-form__value form__email" type="text" required >
          <label for="email" class="auth-form__message">
            Uppercase and lowercase Latin letters A to Z and a to z
            digits 0 to 9
          </label>
        </div>
      </div>
      <div class="auth-form__wrapper">
        <div class="auth-form__ava">
          <div class="auth-form__img-wrapper">
            <canvas id="canvas">
            <img class="auth-form__img" src="./assets/unknown.png" alt="avatar">
            </canvas>
          </div>
        </div>
        <div class="auth-form__upload-file">
          <div class="auth-form__group">
            <input type="file" name="file" id="file" class="auth-form__img-btn input-file">
            <label for="file" class="auth-form__labelFile">
              <span class="auth-form__filename">Add avatar</span>
            </label>
          </div>
        </div>
        <div class="auth-form__buttons">
          <button class="auth-form__btn auth-form__btn_submit"" type="submit" >
            Add user
          </button>
          <button class="auth-form__btn auth-form__btn_cancel" type="button">
            cancel
          </button>
        </div>
      </div>
  </div></div></div>`;

    this.root?.appendChild(this.page);

    const modalBtn: any = document.getElementById('modal-btn');
    const modal: any = document.querySelector('.modal');
    // const closeBtn: any = document.querySelector('.close-btn');

    if (modalBtn) {
      modalBtn.onclick = function () {
        modal.style.display = 'block';
      };
    }

    window.onclick = function (event: any) {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    };

    let dataImageUrl: string;
    let avatar: any;

    function handleFiles(e: any, callback: any): HTMLImageElement {
      const img = new Image();
      let dataURL: string;
      img.crossOrigin = 'Anonymous';
      img.src = URL.createObjectURL(e.target.files[0]);
      img.onload = function () {
        const canvas: any = document.getElementById('canvas');
        const ctx: any = canvas.getContext('2d');
        ctx.drawImage(img, 20, 20);
        // avatar = document.createElement('div');
        // avatar.innerHTML = `<div><img class="avatar" src="${canvas.toDataURL()}" alt=""></div>`;
        dataURL = canvas.toDataURL();
        callback(dataURL);
      };
      return img;
    }

    // function toDataURL(src, callback, outputFormat) {
    //   var img = new Image();
    //   img.crossOrigin = 'Anonymous';
    //   img.onload = function () {
    //     var canvas = document.createElement('CANVAS');
    //     var ctx = canvas.getContext('2d');
    //     var dataURL;
    //     canvas.height = this.naturalHeight;
    //     canvas.width = this.naturalWidth;
    //     ctx.drawImage(this, 0, 0);
    //     dataURL = canvas.toDataURL(outputFormat);
    //     callback(dataURL);
    //   };
    //   img.src = src;
    //   if (img.complete || img.complete === undefined) {
    //     img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    //     img.src = src;
    //   }
    // }

    // function toDataURL(url, callback) {
    //   var xhr = new XMLHttpRequest();
    //   xhr.onload = function () {
    //     var reader = new FileReader();
    //     reader.onloadend = function () {
    //       callback(reader.result);
    //     }
    //     reader.readAsDataURL(xhr.response);
    //   };
    //   xhr.open('GET', url);
    //   xhr.responseType = 'blob';
    //   xhr.send();
    // }

    // toDataURL('https://www.gravatar.com/avatar/d50c83cc0c6523b4d3f6085295c953e0', function (dataUrl) {
    //   console.log('RESULT:', dataUrl)
    // })

    const input: any = document.querySelector('#file');
    input.addEventListener('change', (event: any) => {
      const dataImage = handleFiles(event, (dataUrl: string) => {
        // console.log('RESULT:', dataUrl);
        dataImageUrl = dataUrl;
      });
      // dataImageUrl = dataImage.src;
      // console.log(dataImageUrl);
    });
    // console.log(dataImageUrl);
    function saveData() {
      const firstName = (<HTMLInputElement>document.querySelector('#firstName'));
      const secondName = (<HTMLInputElement>document.querySelector('#secondName'));
      const email = (<HTMLInputElement>document.querySelector('#email'));
      const data = {
        firstName: firstName?.value,
        secondName: secondName?.value,
        dataImageUrl,
        email: email?.value,
      };
      return data;
    }

    this.iDB = new DataBase();
    this.iDB.init('maxfri');
    const listButton = document.querySelector('.list');

    // const writeButton = document.querySelector('.write');
    // // console.log(listButton);
    // writeButton?.addEventListener('click', () => {
    //   const data = saveData();
    //   this.iDB.write(data.firstName, data.secondName, data.email);
    // });

    const saveButton = document.querySelector('.auth-form__btn_submit');
    saveButton?.addEventListener('click', () => {
      const data = saveData();
      this.iDB.write(data.firstName, data.secondName, data.email, data.dataImageUrl);
      const reg = document.querySelector('.header__register');
      const header = document.querySelector('.header__wrapper');
      const user = document.createElement('div');
      user.innerHTML = `<div class="avatar">
      <img class="avatar-img" src="${data.dataImageUrl}" alt=""></div>
      <div>${data.firstName} ${data.secondName}</div>`;
      reg?.replaceWith(user);
      const gameButton = document.createElement('div');
      gameButton.innerHTML = '<a href="#/game">GAME</a>';
      header?.appendChild(gameButton);
    });

    return this.page;
  }
}
