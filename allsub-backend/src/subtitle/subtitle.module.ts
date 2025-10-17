import { Module } from '@nestjs/common';
import { SubtitleGateway } from './subtitle.gateway';
import { SpeechService } from './speech.service';
import { TranslationService } from './translation.service';

@Module({
  providers: [SubtitleGateway, SpeechService, TranslationService],
  exports: [SpeechService, TranslationService],
})
export class SubtitleModule {}

