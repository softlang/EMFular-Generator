import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FileUploadCompontent } from './components/file-upload/file-upload';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FileUploadCompontent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = 'test';
}
