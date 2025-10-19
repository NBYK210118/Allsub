import { Module } from '@nestjs/common';
import { SubtitleGateway } from './subtitle.gateway';
import { AudioStreamGateway } from './audio-stream.gateway';
import { SpeechService } from './speech.service';
import { TranslationService } from './translation.service';

@Module({
  providers: [SubtitleGateway, AudioStreamGateway, SpeechService, TranslationService],
  exports: [SpeechService, TranslationService],
})
export class SubtitleModule {}

