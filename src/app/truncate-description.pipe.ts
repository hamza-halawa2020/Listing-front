import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncateDescription',
  standalone: true
})
export class TruncateDescriptionPipe implements PipeTransform {
  transform(value: string, limit: number = 10): string {
    const words = value.split(' ');
    if (words.length > limit) {
      return words.slice(0, limit).join(' ') + '...';
    }
    return value;
  }
}
