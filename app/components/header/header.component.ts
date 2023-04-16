import { Component, OnInit } from '@angular/core';
import { CategoryService } from 'src/app/shared/services/category/category.service';
import { getDownloadURL, ref, Storage, uploadBytesResumable} from '@angular/fire/storage'
import { ICategoryResponse } from 'src/app/shared/interfaces/category';
import { ProductResponse } from 'src/app/shared/interfaces/product';
import { reduce } from 'rxjs';
import { OrderService } from 'src/app/shared/services/order/order.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit {
  public categoryForm:any;
  public categoryList!:Array<ICategoryResponse>;
  public smalCategoryList:any=[]
  public basketCheck=false;
  public menuLaptop=false;
  public menuMobile=false;
  public rotateLine=false;
  public basket!:Array<ProductResponse>;
  public totalprice=0;
  public totalcount=0;
  public price!:number;
  public count!:number;
  constructor(
    private categoryServise:CategoryService,
    private storage: Storage,
    private orderService:OrderService
  ) { }
  categoryNameExport(info:any){
    this.categoryServise.categoryName=info.textContent;
    console.log(info.textContent)
  }
  basketActive(){
    this.basketCheck=!this.basketCheck;
  }
  menuActive(){
    this.menuMobile=!this.menuMobile;
    this.rotateLine=!this.rotateLine;
  }
  menuToggle(){
    this.menuLaptop=!this.menuLaptop;
    this.rotateLine=!this.rotateLine;
  }
  async uploadFile(folder: string, name:string, file: File):Promise<string>{
    const path =`${folder}/${name}`;
    let storageRef = ref(this.storage, path);
    let task = uploadBytesResumable(storageRef, file);
    await task;
    let url =getDownloadURL(storageRef);
    console.log(url)
    return Promise.resolve(url);
  }
  upload(event:any){
    let file = event.target.files[0];
    this.uploadFile('category-images', file.name, file)
    .then(data => {
      this.categoryForm.patchValue({
        imagePath: data
      });
    })
    .catch(err => {
      console.log(err);
    })
  }
  valueByControl(control: string): string {
    return this.categoryForm.get(control)?.value;
  }
  loadCategory(){
    this.categoryServise.getAll().subscribe(data =>{
      this.categoryList=data;
      let i=0;
      for(let info of this.categoryList){
        if(i<4){
          i++;
          this.smalCategoryList.push(info)
        }
      }
    })
  }
  loadBasket(){
    if(localStorage.length>0 && localStorage.getItem("basket")){
      this.basket=JSON.parse(localStorage.getItem("basket") as string)
    }
    this.totalPrice();
    this.totalCount();
  }
  totalPrice(){
    if(this.basket){
    this.totalprice=this.basket.reduce((total:number,product:ProductResponse) =>total+product.count*Number(product.price),0)
    }
  }
  totalCount(){
    if(this.basket){
    this.totalcount=this.basket.reduce((total:number,product:ProductResponse) =>total+product.count,0)
    }
  }
  updateBasket(){
    this.orderService.changeBasket.subscribe(()=>{
      this.loadBasket();
    })
  }
  fCount(info: ProductResponse, check: boolean) {
    if (check) {
      info.count++;
      this.changeBasket(info,check)
    }
    else if (!check && info.count > 1) {
      info.count--;
      this.changeBasket(info,check)
    }
  }
  changeBasket(product:ProductResponse,check:boolean){
    let basket = [];
    if (localStorage.length > 0 && localStorage.getItem('basket')) {
      basket = JSON.parse(localStorage.getItem('basket') as string)
      if (basket.some((prod:ProductResponse) => prod.id === product.id)) {
        let index = basket.findIndex((prod:ProductResponse) => prod.id === product.id);
        if(check){
          basket[index].count++;
        }
        else{
          basket[index].count --;
        }
      }
      else {
        basket.push(product)
      }
    }
    else {
      basket.push(product)
    }
    localStorage.setItem('basket', JSON.stringify(basket))
    product.count = 1;
    this.orderService.changeBasket.next(true)
  }

  
  ngOnInit(): void {
    this.loadCategory();
    this.loadBasket();
    this.updateBasket()
  }

}
